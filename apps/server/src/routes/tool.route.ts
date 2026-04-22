import { createRoute } from '@hono/zod-openapi';
import { ToolContract } from '@interface-adapter/contracts/route/tool.contract';

import { type ToolStreamMessageType } from '@domain/value-objects/tool.vo';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import { makeToolDetailUC, type ToolDetailUCDeps } from '@usecase/tool/tool-detail.uc';
import { makeToolListUC, type ToolListUCDeps } from '@usecase/tool/tool-list.uc';
import { makeToolRunUC, type ToolRunUCDeps } from '@usecase/tool/tool-run.uc';
import { getErrText } from '@shared/utils/err';

export type ToolRouteDeps = ToolRunUCDeps & ToolListUCDeps & ToolDetailUCDeps;

// PlugininstallUC
export const makeToolRoute = (deps: ToolRouteDeps) => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      ...ToolContract.Get.meta,
      request: {
        query: ToolContract.Get.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ToolContract.Get.response[200]
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: ToolContract.Get.response[404]
            }
          }
        }
      }
    }),
    async (c) => {
      const toolDetailUC = makeToolDetailUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await toolDetailUC(query);

      if (err) {
        return R.fail(c, 404, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...ToolContract.List.meta,
      request: {
        query: ToolContract.List.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ToolContract.List.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: ToolContract.List.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const toolListUC = makeToolListUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await toolListUC(query);

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...ToolContract.RunStream.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: ToolContract.RunStream.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'text/event-stream': {
              schema: ToolContract.RunStream.response[200]
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: ToolContract.RunStream.response[400]
            }
          }
        }
      }
    }),
    async (c) => {
      const encoder = new TextEncoder();
      const body = c.req.valid('json');
      const uc = makeToolRunUC(deps);
      const [result, err] = await uc(body);
      if (err) {
        return c.json({ error: err }, 400);
      }

      const stream = new ReadableStream<Uint8Array>({
        start: async (controller) => {
          try {
            await result.consume(async (message) => {
              controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n\n`));
            });
          } catch (streamErr) {
            const errorMessage: ToolStreamMessageType = {
              type: 'error',
              data: getErrText(streamErr, 'Tool stream failed')
            };
            controller.enqueue(encoder.encode(`${JSON.stringify(errorMessage)}\n\n`));
          } finally {
            controller.close();
          }
        },
        cancel: () => {
          result.close();
        }
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive'
        }
      });
    }
  );

  return route;
};
