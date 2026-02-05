import { R, createOpenAPIHono } from '@/utils/http';
import { listModelsRoute, getProvidersRoute } from './schemas/routes';
import type { I18nStringStrictType } from '@fastgpt-plugin/helpers/index';
import { getModelAvatarUrl } from './avatars';
import { modelsBuffer, ModelProvidersSorted, aiproxyIdMap } from './constants';

const models = createOpenAPIHono<Env>().basePath('/models');

/**
 * List all models
 */
models.openapi(listModelsRoute, async (c) => {
  return c.json(R.success(modelsBuffer.data), 200);
});

/**
 * Get model providers
 */
models.openapi(getProvidersRoute, async (c) => {
  const modelProviders = (await Promise.all(
    ModelProvidersSorted.map(async (provider) => {
      return {
        ...provider,
        avatar: await getModelAvatarUrl(provider.provider)
      };
    })
  )) as { provider: string; value: I18nStringStrictType; avatar: string }[];

  return c.json(
    R.success({
      modelProviders,
      aiproxyIdMap
    }),
    200
  );
});

export default models;
