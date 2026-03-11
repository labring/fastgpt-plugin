import { createToolHandler } from '@fastgpt-plugin/helpers/index';
import { InputSchema, OutputSchema } from './schemas';

export const handler = createToolHandler(InputSchema, OutputSchema, async (_, { systemVar }) => {
  return {
    time: systemVar.time
  };
});
