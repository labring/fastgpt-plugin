import { s } from '@/router/init';
import { contract } from '@/contract';
import { tools } from '@tool/constants';
import { c } from '@/contract/init';
import { formatToolList } from '@tool/utils/tool';
import type { ToolListItemType } from '@tool/type/tool';

export const listToolContract = {
  path: '/list',
  method: 'GET',
  description: 'Get tools list',
  responses: {
    200: c.type<Array<ToolListItemType>>()
  }
} as const;

export const getToolsHandler = () =>
  s.route(contract.tool.list, async () => {
    return {
      status: 200,
      body: formatToolList(tools)
    };
  });
