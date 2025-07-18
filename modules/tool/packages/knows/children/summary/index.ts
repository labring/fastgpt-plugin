import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

/**
 * KnowS 场景总结工具
 * 基于检索结果生成场景化的医学总结
 */
export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});