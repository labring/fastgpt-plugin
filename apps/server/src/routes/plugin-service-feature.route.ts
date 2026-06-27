import { PluginServiceFeatureContract } from '@interface-adapter/contracts/route/plugin-service-feature.contract';

import { serverEnv } from '@infrastructure/env';
import { createOpenAPIHono, createRoute, R } from '@infrastructure/hono/utils/response';

export type PluginServiceFeatureRouteDeps = {
  remoteDebugEnabled?: boolean;
};

export const makePluginServiceFeatureRoute = (deps: PluginServiceFeatureRouteDeps = {}) => {
  const route = createOpenAPIHono();
  const remoteDebugEnabled = deps.remoteDebugEnabled ?? serverEnv.REMOTE_DEBUG_ENABLED;

  route.openapi(
    createRoute({
      ...PluginServiceFeatureContract.Get.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginServiceFeatureContract.Get.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginServiceFeatureContract.Get.response[500]
            }
          }
        }
      }
    }),
    (c) =>
      R.success(c, {
        remoteDebug: remoteDebugEnabled
      })
  );

  return route;
};
