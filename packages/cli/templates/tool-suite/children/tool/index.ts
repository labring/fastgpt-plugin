import { exportTool } from '@fastgpt-plugin/helpers/tools/helper';
import config from './config';
import { tool as toolCb } from './src/tool';
import { InputSchema, OutputSchema } from './src/schemas';

export default exportTool({
  toolCb,
  InputType: InputSchema,
  OutputType: OutputSchema,
  config
});
