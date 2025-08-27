import { s } from '@/router/init';
import { contract } from '@/contract';
import { getToolType } from '@tool/controller';

export const getTypeHandler = s.route(contract.tool.getType, async () => {
  const type = getToolType();

  return {
    status: 200,
    body: type
  };
});
