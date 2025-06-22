import { z } from 'zod';
import { s } from '@/router/init';
import { contract } from '@/contract';
import { formatToolList, ToolListItemSchema } from '@tool/type/tool';
import { getTool } from '@tool/controller';

export const getToolContract = {
  path: '/get',
  method: 'GET',
  description: 'Get a tool',
  query: z.object({
    toolId: z.string()
  }),
  responses: {
    '200': ToolListItemSchema
  }
} as const;

export const getToolHandler = () =>
  s.route(contract.tool.getTool, async ({ query: { toolId } }) => {
    const tool = getTool(toolId);

    if (!tool) {
      return {
        status: 404,
        body: { error: 'Tool not found' }
      };
    }

    return {
      status: 200,
      body: formatToolList([tool])[0]
    };
  });
