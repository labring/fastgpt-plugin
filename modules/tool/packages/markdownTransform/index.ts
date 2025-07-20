import config from './config';
import { InputType, tool as toolCb } from './src';
import { OutputType } from './src/type';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
