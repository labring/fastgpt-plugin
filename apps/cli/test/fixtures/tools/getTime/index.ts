import { createToolHandler, defineTool } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({}),
  outputSchema: z.object({
    time: z.string()
  }),
  handler: async (_input, ctx) => {
    return {
      time: ctx.systemVar.time
    };
  }
});

export default defineTool({
  manifest: {
    description: {
      en: 'Get current time',
      'zh-CN': '获取当前时间'
    },
    name: {
      en: 'Get Time',
      'zh-CN': '获取时间'
    },
    pluginId: 'getTime',
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    }
  },
  handler
});
