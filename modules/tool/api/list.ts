import { s } from '@/router/init';
import { contract } from '@/contract';
import { tools } from '@tool/constants';
import { formatToolList } from '@tool/utils/tool';

export const getToolsHandler = s.route(contract.tool.list, async () => {
  return {
    status: 200,
    body: formatToolList(tools)
  };
});
