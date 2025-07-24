import config from './config';
import { InputType, OutputType, tool as toolCb } from './src';
import { exportTool } from '@tool/utils/tool';

/**
 * KnowS 证据分析工具
 * 对医学文献证据进行深度分析，提供结构化的分析结果
 */
export default exportTool({
  toolCb,
  InputType,
  OutputType,
  config
});
