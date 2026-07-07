import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({
    delay: z.number().meta({
      title: 'Delay',
      description: 'Delay duration in milliseconds',
      isToolParams: true
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({}).meta({} satisfies OutputSchemaMetaType),
  handler: async (input, _ctx) => {
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
