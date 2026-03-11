import { createToolHandler } from '@fastgpt-plugin/helpers';
import { InputSchema, OutputSchema } from './schemas';

export const tool = createToolHandler(InputSchema, OutputSchema, async (_input, _ctx) => {
  return { message: 'Hello from oracle' };
});
