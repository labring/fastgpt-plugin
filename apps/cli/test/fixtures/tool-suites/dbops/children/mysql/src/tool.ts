import type { ToolContextType } from '@fastgpt-plugin/helpers';
import { createToolHandler } from '@fastgpt-plugin/helpers/index';

import { InputSchema, OutputSchema } from './schemas';

export const tool = createToolHandler({
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  handler: async (input, ctx) => {
    return {
      message: 'Hello from MySQL'
    };
  }
});
