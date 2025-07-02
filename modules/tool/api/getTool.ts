import { s } from '@/router/init';
import { contract } from '@/contract';
import { getTool } from '@tool/controller';
import { formatToolList } from '@tool/utils/tool';

export const getToolHandler = s.route(contract.tool.getTool, async ({ query: { toolId } }) => {
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
