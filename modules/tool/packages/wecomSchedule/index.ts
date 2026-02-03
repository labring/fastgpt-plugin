import config from './config';
import { exportTool } from '@tool/utils/tool';
import { tool as toolCb, InputType, OutputType } from './src';

export default exportTool({
  config,
  toolCb,
  InputType,
  OutputType
});
