import { modelsBuffer, aiproxyChannelsSorted, ModelProvidersSorted } from '@model/constants';
import { getModelAvatarUrl, getChannelAvatarUrl } from '@model/avatars';
import { R, createOpenAPIHono } from '@/utils/http';
import { listModelsRoute, getProvidersRoute } from './schemas/routes';
import type { I18nStringStrictType } from '@/validates/i18n';
import type { AIProxyChannelsType } from '@model/constants/shared';

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

  const resolvedAiproxyChannels: AIProxyChannelsType = aiproxyChannelsSorted.map((entry) => ({
    ...entry,
    avatar: getChannelAvatarUrl(entry.avatar)
  }));

  return c.json(
    R.success({
      modelProviders,
      aiproxyChannels: resolvedAiproxyChannels
    }),
    200
  );
});

export default models;
