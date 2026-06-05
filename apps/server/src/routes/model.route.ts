import { ModelContract } from '@interface-adapter/contracts/route/model.contract';

import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import { createRoute } from '@infrastructure/hono/utils/response';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import {
  getChannelAvatarUrl,
  getModelAvatarUrl,
  getSortedAIProxyChannels,
  getSortedModelProviders,
  modelList
} from '@infrastructure/static-data/models/model-static';

export type ModelRouteDeps = {
  publicRemoteFileStorageRepo: Pick<RemoteFileStoragePort, 'getAccessUrl'>;
};

export const makeModelRoute = (deps: ModelRouteDeps) => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      ...ModelContract.List.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ModelContract.List.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: ModelContract.List.response[500]
            }
          }
        }
      }
    }),
    async (c) => R.success(c, modelList)
  );

  route.openapi(
    createRoute({
      ...ModelContract.GetProviders.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ModelContract.GetProviders.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: ModelContract.GetProviders.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const modelProviders = await Promise.all(
        getSortedModelProviders().map(async (provider) => ({
          ...provider,
          avatar: await getModelAvatarUrl(provider.provider, deps.publicRemoteFileStorageRepo)
        }))
      );
      const aiproxyChannels = await Promise.all(
        getSortedAIProxyChannels().map(async (channel) => ({
          ...channel,
          avatar: await getChannelAvatarUrl(channel.avatar, deps.publicRemoteFileStorageRepo)
        }))
      );

      return R.success(c, {
        modelProviders,
        aiproxyChannels
      });
    }
  );

  return route;
};
