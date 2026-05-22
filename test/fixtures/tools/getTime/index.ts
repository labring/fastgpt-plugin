import {
  createToolHandler,
  defineTool,
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import { InputType, OutputType, tool as toolCb } from './src';
import z from 'zod';

const secretSchema = z.object({});
const inputSchema = z.object({});
const outputSchema = z.object({
  time: z
    .string()
    .optional()
    .meta({
      title: 'Time'
    } satisfies OutputSchemaMetaType)
});

const handler = createToolHandler({
  inputSchema,
  outputSchema,
  secretSchema,
  handler: async (input, ctx) => {
    const parsedInput = await InputType.parseAsync(input);
    const output = await toolCb(parsedInput, ctx);
    return OutputType.parseAsync(output);
  }
});

const tool = defineTool({
  manifest: {
    pluginId: 'getTime',
    name: {
      en: 'Get current time',
      'zh-CN': '获取当前时间'
    },
    description: {
      en: 'Get current time',
      'zh-CN': '获取当前时间'
    },
    version: '0.1.1',
    versionDescription: {
      en: 'Default version',
      'zh-CN': 'Default version'
    },
    tags: ['tools']
  },
  secretSchema,
  handler
});

export default tool;
