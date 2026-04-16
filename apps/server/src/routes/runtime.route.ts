import { createRoute, z } from '@hono/zod-openapi';

import { makeRuntimeMetricsUC, type RuntimeMetricsUCDeps } from '@usecase/runtime/runtime-metrics.uc';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';

export type RuntimeRouteDeps = RuntimeMetricsUCDeps;

export const makeRuntimeRoute = (deps: RuntimeRouteDeps) => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      path: '/runtime/metrics',
      tags: ['runtime'],
      method: 'get',
      responses: {
        200: {
          description: 'Runtime metrics',
          content: {
            'application/json': {
              schema: z.object({
                data: z.unknown()
              })
            }
          }
        },
        500: {
          description: 'Runtime metrics failed',
          content: {
            'application/json': {
              schema: z.object({
                error: z.object({
                  en: z.string(),
                  'zh-CN': z.string().optional(),
                  'zh-Hant': z.string().optional()
                })
              })
            }
          }
        }
      }
    }),
    async (c) => {
      const runtimeMetricsUC = makeRuntimeMetricsUC(deps);
      const [result, err] = await runtimeMetricsUC({});

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  return route;
};
