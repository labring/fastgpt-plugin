import { s } from '@/router/init';
import { contract } from '@/contract';
import { aiproxyIdMap, ModelProviders } from '../constants';

export const getProvidersHandler = s.route(contract.model.getProviders, async () => {
  return {
    status: 200,
    body: {
      modelProviders: ModelProviders,
      aiproxyIdMap
    }
  };
});
