import { exportTool } from '@tool/utils/tool';
import config from './config';
import { tool as toolCb, InputType, OutputType } from './src/index';

export default exportTool({
  config,
  toolCb,
  InputType,
  OutputType
});
