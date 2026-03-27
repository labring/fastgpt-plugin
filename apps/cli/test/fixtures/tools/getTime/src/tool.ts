import { createToolHandler } from '@fastgpt-plugin/helpers/index';
import { InputSchema, OutputSchema } from './schemas';
import z from 'zod';

export const handler = createToolHandler({
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  secretSchema: z.object({
    test: z.string().meta({
      title: '测试字段',
      description: '这是一个测试字段'
    })
  }),
  handler: async (input, { systemVar, hostEmitter, secrets }) => {
    await hostEmitter.streamResponse({
      type: 'answer',
      content: 'hi'
    });

    await hostEmitter.streamResponse({
      type: 'answer',
      content: input.msg
    });

    return {
      time: systemVar.time,
      test: secrets.test
    };
  }
});
