import { s } from '@/router/init';
import { contract } from '@/contract';
import { modelsBuffer } from '../constants';

export const getModelsHandler = s.route(contract.model.list, async () => {
  return {
    status: 200,
    body: modelsBuffer.data
  };
});
