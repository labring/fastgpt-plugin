import type { AnswerType, ToolInput, ToolOutput } from '../../../shared/types';

/**
 * 总结工具相关类型定义
 */

// 总结工具输入
export interface SummaryToolInput extends ToolInput {
  question_id: string;
  answer_type: AnswerType[];
  stream_mode?: boolean;
  api_key?: string;
  environment?: 'production' | 'development';
}

// 总结工具输出
export interface SummaryToolOutput extends ToolOutput {
  content?: string;
  answer_types?: AnswerType[];
  citation_ids?: string[];
  citation_count?: number;
  stream_chunks?: StreamChunk[];
  word_count?: number;
}

// 流式内容片段
export interface StreamChunk {
  content: string;
  order: number;
  timestamp: number;
}

// 答案类型标签映射
export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  CLINICAL: '临床答案',
  RESEARCH: '学术答案',
  POPULAR_SCIENCE: '科普答案'
};

// 总结统计信息
export interface SummaryStats {
  word_count: number;
  citation_count: number;
  answer_types: AnswerType[];
  has_citations: boolean;
}
