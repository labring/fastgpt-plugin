import { createToolHandler } from '@fastgpt-plugin/helpers';
import { InputSchema, OutputSchema } from './schemas';

export const tool = createToolHandler({
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (_input, _ctx) => {
    return { message: 'Hello from sqlserver' };
  }
});
