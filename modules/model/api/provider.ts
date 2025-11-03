import { s } from '@/router/init';
import { contract } from '@/contract';
import { aiproxyIdMap, ModelProviders } from '../constants';
import { getModelAvatarUrl } from '../avatars';

export const getProvidersHandler = s.route(contract.model.getProviders, async () => {
  // Convert avatar paths to full URLs
  const modelProviders = await Promise.all(
    ModelProviders.map(async (provider) => {
      return {
        ...provider,
        avatar: await getModelAvatarUrl(provider.provider)
      };
    })
  );
  return {
    status: 200,
    body: {
      modelProviders,
      aiproxyIdMap
    }
  };
});
