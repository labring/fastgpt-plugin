import type { ToolContextType } from '@fastgpt-plugin/helpers';
import { InputSchema, OutputSchema } from './schemas';
import { createToolHandler } from '@fastgpt-plugin/helpers/index';

export const tool = createToolHandler(InputSchema, OutputSchema, async (input, ctx) => {
  return {
    message: 'Hello from MySQL'
  };
});
