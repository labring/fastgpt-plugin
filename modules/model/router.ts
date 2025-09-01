import { s } from '@/router/init';
import { contract } from '@/contract';
import { getModelsHandler } from './api/list';
import { getProvidersHandler } from './api/provider';

export const modelRouter = s.router(contract.model, {
  list: getModelsHandler,
  provider: getProvidersHandler
});
