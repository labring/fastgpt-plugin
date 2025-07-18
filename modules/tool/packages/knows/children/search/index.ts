import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

/**
 * KnowS 医学文献检索工具
 * 基于KnowS平台的专业医学文献检索工具
 */
export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});