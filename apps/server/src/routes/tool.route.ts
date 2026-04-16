import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';

import { ToolRunInputSchema } from '@domain/value-objects/tool.vo';
import { makeToolRunUC, type ToolRunUCDeps } from '@usecase/tool/tool-run.uc';

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
                type: z.string(),
                data: z.string()
              })
            }
          }
        }
      }
    }),
    async (c) => {
      const body = await c.req.json();
      const uc = makeToolRunUC(deps);
      const [result, err] = await uc(ToolRunInputSchema.parse(body));
      if (err) {
        return c.json({ error: err.reason }, 400);
      }
      return c.json(result, 200);
    }
  );

  return route;
};
