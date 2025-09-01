import { s } from '@/router/init';
import { contract } from '@/contract';
import { aiproxyIdMap, ModelProviders } from '../constants';

export const getProvidersHandler = s.route(contract.model.provider, async () => {
  return {
    status: 200,
    body: {
      ModelProviders,
      aiproxyIdMap
    }
  };
});
