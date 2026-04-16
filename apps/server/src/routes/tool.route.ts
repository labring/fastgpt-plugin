import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';

import {
  ToolRunInputSchema,
  ToolStreamMessageSchema,
  type ToolStreamMessageType
} from '@domain/value-objects/tool.vo';
import { makeToolRunUC, type ToolRunUCDeps } from '@usecase/tool/tool-run.uc';
import { getErrText } from '@shared/utils/err';

export type ToolRouteDeps = ToolRunUCDeps;

// PlugininstallUC
export const makeToolRoute = (deps: ToolRouteDeps) => {
  const route = new OpenAPIHono();

  route.openapi(
    createRoute({
      path: '/tool/runStream',
      tags: ['tool'],
      method: 'post',
      request: {
        body: {
          content: {
            'application/json': {
              schema: ToolRunInputDTOSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Tool run result stream',
          content: {
            'text/event-stream': {
              schema: z.object({
                type: z.string().openapi({
                  description: 'Message type, can be "data" or "error"',
                  example: 'data'
                })
              })
            }
          }
        }
      }
    }),
    async (c) => {
      const encoder = new TextEncoder();
      const body = await c.req.json();
      const uc = makeToolRunUC(deps);
      const [result, err] = await uc(ToolRunInputSchema.parse(body));
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
