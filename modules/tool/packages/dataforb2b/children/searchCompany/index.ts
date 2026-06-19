import config from './config';
import { InputType, OutputType, tool } from './src';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb: tool,
  InputType,
  OutputType,
  config
});
