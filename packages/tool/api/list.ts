import { s } from '@/router/init';
import { contract } from '@/contract';
import { tools } from '@tool/constants';
import { c } from '@/contract/init';
import { z } from 'zod';
import type { InputType } from '@tool/type/fastgpt';
import { formatToolList } from '@tool/utils/tool';
import type { ToolListItemType } from '@tool/type/tool';

export const listToolContract = {
  path: '/list',
  method: 'GET',
  description: 'Get tools list',
  responses: {
    '200': c.type<
      Array<
        Omit<ToolListItemType, 'inputs'> & {
          inputs: InputType[];
        }
      >
    >()
  }
} as const;

export const getToolsHandler = () =>
  s.route(contract.tool.list, async () => {
    return {
      status: 200,
      body: formatToolList(tools)
    };
  });
