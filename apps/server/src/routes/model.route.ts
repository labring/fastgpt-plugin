import { createRoute, z } from '@hono/zod-openapi';

import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import {
  aiproxyIdMap,
  getModelAvatarUrl,
  getSortedModelProviders,
  modelList
} from '@infrastructure/static-data/models/model-static';

const I18nSchema = z.object({
  en: z.string(),
  'zh-CN': z.string().optional(),
  'zh-Hant': z.string().optional()
});

export type ModelRouteDeps = {
  publicRemoteFileStorageRepo: Pick<RemoteFileStoragePort, 'getAccessUrl'>;
};

export const makeModelRoute = (deps: ModelRouteDeps) => {
  const route = createOpenAPIHono().basePath('/models');

  route.openapi(
    createRoute({
      method: 'get',
      path: '/',
      tags: ['Models'],
      summary: 'List all models',
      description: 'Get a list of all available AI models',
      responses: {
        200: {
          description: 'List of models',
          content: {
            'application/json': {
              schema: z.object({
                data: z.array(z.unknown())
              })
            }
          }
        }
      }
    }),
    async (c) => R.success(c, modelList)
  );

  route.openapi(
    createRoute({
      method: 'get',
      path: '/get-providers',
      tags: ['Models'],
      summary: 'Get model providers',
      description: 'Get all available model providers with their avatars',
      responses: {
        200: {
          description: 'Model providers',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  modelProviders: z.array(
                    z.object({
                      provider: z.string(),
                      value: I18nSchema,
                      avatar: z.string()
                    })
                  ),
                  aiproxyIdMap: z.record(
                    z.string(),
                    z.object({
                      name: I18nSchema,
                      provider: z.string().optional(),
                      avatar: z.string().optional()
                    })
                  )
                })
              })
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

      return R.success(c, {
        modelProviders,
        aiproxyIdMap
      });
    }
  );

  return route;
};
