import { createRoute } from '@hono/zod-openapi';
import { ToolRunInputDTOSchema } from '@interface-adapter/contracts/dto/tool.dto';
import {
  makeToolRunCtrl,
  type ToolRunCTRLDeps
} from '@interface-adapter/controllers/tool/run.ctrl';
import { honoRoute } from '@interface-adapter/http/hono.adapter';

import { ToolStreamMessageSchema } from '@domain/value-objects/tool.vo';

export type ToolRouteDeps = ToolRunCTRLDeps;

// PlugininstallUC
export const makeToolRoute = (deps: ToolRouteDeps) => {
  const route = honoRoute();

  const toolRunCtrl = makeToolRunCtrl(deps);

  route.openapi(
    createRoute({
      path: '/tool/runStream',
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
              schema: ToolStreamMessageSchema
            }
          }
        }
      }
    }),
    async (c) => {
      const body = await c.req.json();
      const [result, err] = await toolRunCtrl(body);
      if (err) {
        return c.json({ error: err.reason }, 400);
      }
      return c.json(result, 200);
    }
  );

  return route;
};
