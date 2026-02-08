import { exportTool } from '@fastgpt-plugin/helpers/tools/helper';
import config from './config';
import { InputSchema, OutputSchema } from './src/schemas';
import { handler } from './src/tool';

export default exportTool({
  handler,
  InputSchema,
  OutputSchema,
  config
});
