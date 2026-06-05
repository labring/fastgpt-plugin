import { ErrorResponseDTOSchema } from '@interface-adapter/contracts/dto/common.dto';
import z from 'zod';

import { makeRuntimeMetricsUC, type RuntimeMetricsUCDeps } from '@usecase/runtime/runtime-metrics.uc';
import { createRoute } from '@infrastructure/hono/utils/response';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import { getLogger, root } from '@infrastructure/logger';

export type RuntimeRouteDeps = Omit<RuntimeMetricsUCDeps, 'logger'>;

export const makeRuntimeRoute = (deps: RuntimeRouteDeps) => {
  const route = createOpenAPIHono();
  const logger = getLogger(root);

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
                error: ErrorResponseDTOSchema
              })
            }
          }
        }
      }
    }),
    async (c) => {
      const runtimeMetricsUC = makeRuntimeMetricsUC({ ...deps, logger });
      const [result, err] = await runtimeMetricsUC({});

      if (err) {
        return R.fail(c, 500, err.error);
      }

      return R.success(c, result);
    }
  );

  return route;
};
