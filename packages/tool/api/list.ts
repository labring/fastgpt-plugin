import { s } from '@/router/init';
import { contract } from '@/contract';
import { formatToolList } from '@tool/type/tool';
import { tools } from '@tool/constants';
import { c } from '@/contract/init';
import { z } from 'zod';
import { ToolListItemSchema } from '@tool/type/tool';
import type { InputType } from '@tool/type';

export const listToolContract = {
  path: '/list',
  method: 'GET',
  description: 'Get tools list',
  responses: {
    '200': c.type<
      Array<
        Omit<z.infer<typeof ToolListItemSchema>, 'inputs'> & {
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
