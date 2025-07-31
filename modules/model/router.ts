import { s } from '@/router/init';
import { contract } from '@/contract';
import { getModelsHandler } from './api/list';

export const modelRouter = s.router(contract.model, {
  list: getModelsHandler
});
