import { createToolHandler, defineTool } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    delay: z.number()
  }),
  outputSchema: z.object({}),
  handler: async (input, ctx) => {
    await new Promise((resolve) => setTimeout(resolve, input.delay));
    return {};
  }
});

const tool = defineTool({
  manifest: {
    description: {
      en: 'Delay for a specified amount of time',
      'zh-CN': '延迟指定的时间'
    },
    name: {
      en: 'Delay',
      'zh-CN': '延迟工具'
    },
    pluginId: 'delay',
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    }
  },
  handler
});

export default tool;
