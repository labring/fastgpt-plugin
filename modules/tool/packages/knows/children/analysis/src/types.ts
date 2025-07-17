import type { StreamResponse, ToolInput, ToolOutput } from '../../../shared/types';

/**
 * 分析工具相关类型定义
 */

// 分析类型
export type AnalysisType = 'single_summary' | 'all_summary' | 'highlight';

// 分析工具输入
export interface AnalysisToolInput extends ToolInput {
  analysis_type: AnalysisType;
  evidence_id?: string;
  question_id?: string;
  stream_mode?: boolean;
  api_key?: string;
  environment?: 'production' | 'development';
}

// 分析工具输出
export interface AnalysisToolOutput extends ToolOutput {
  analysis_type?: AnalysisType;
  summary?: string;
  highlights?: FormattedHighlight[];
  stream_results?: StreamSummaryResult[];
  evidence_count?: number;
}

// 格式化的高亮内容
export interface FormattedHighlight {
  block_type: string;
  block_type_label: string;
  text: string;
  files: string[];
  page_number: number;
  has_files: boolean;
}

// 流式总结结果
export interface StreamSummaryResult {
  evidence_id: string;
  summary: string;
  order: number;
}

// 块类型标签映射
export const BLOCK_TYPE_LABELS: Record<string, string> = {
  caption: '图表标题',
  footnote: '脚注',
  equation: '公式',
  'list-item': '列表项',
  footer: '页脚',
  header: '页头',
  figure: '图片',
  heading: '标题',
  table: '表格',
  paragraph: '段落',
};