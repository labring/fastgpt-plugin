import { s } from '@/router/init';
import { contract } from '@/contract';
import { aiproxyIdMap, ModelProviders } from '../constants';
import { getModelAvatarUrl } from '../avatars';
import type { I18nStringStrictType } from '@/type/i18n';

export const getProvidersHandler = s.route(contract.model.getProviders, async () => {
  // Convert avatar paths to full URLs
  const modelProviders = (await Promise.all(
    ModelProviders.map(async (provider) => {
      return {
        ...provider,
        avatar: await getModelAvatarUrl(provider.provider)
      };
    })
  )) as { provider: string; value: I18nStringStrictType; avatar: string }[];
  return {
    status: 200,
    body: {
      modelProviders,
      aiproxyIdMap
    }
  };
});
