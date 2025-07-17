import type { ToolInput, ToolOutput } from '../../../shared/types';

/**
 * 历史记录工具相关类型定义
 */

// 历史记录类型
export type HistoryType = 'questions' | 'interpretations';

// 历史记录工具输入
export interface HistoryToolInput extends ToolInput {
  history_type: HistoryType;
  page?: number;
  page_size?: number;
  keyword?: string;
  date_from?: string;
  date_to?: string;
  api_key?: string;
  environment?: 'production' | 'development';
}

// 历史记录工具输出
export interface HistoryToolOutput extends ToolOutput {
  history_type?: HistoryType;
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  questions?: QuestionRecord[];
  interpretations?: InterpretationRecord[];
  keyword?: string;
  date_range?: string;
}

// 问题记录
export interface QuestionRecord {
  question_id: string;
  query: string;
  data_scope: string;
  evidence_count: number;
  created_at: string;
  updated_at: string;
  status: 'completed' | 'processing' | 'failed';
  summary?: string;
}

// 文献解读记录
export interface InterpretationRecord {
  interpretation_id: string;
  title: string;
  evidence_id: string;
  evidence_type: string;
  created_at: string;
  updated_at: string;
  status: 'completed' | 'processing' | 'failed';
  summary?: string;
  author?: string;
}

// 分页信息
export interface PaginationInfo {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// 查询参数
export interface QueryParams {
  page: number;
  page_size: number;
  keyword?: string;
  date_from?: string;
  date_to?: string;
}

// 历史记录类型标签映射
export const HISTORY_TYPE_LABELS: Record<HistoryType, string> = {
  questions: '问题列表',
  interpretations: '文献解读列表',
};

// 状态标签映射
export const STATUS_LABELS: Record<string, string> = {
  completed: '已完成',
  processing: '处理中',
  failed: '失败',
};

// 数据范围标签映射
export const DATA_SCOPE_LABELS: Record<string, string> = {
  'all': '全部数据',
  'papers': '学术论文',
  'guidelines': '临床指南',
  'reviews': '综述文献',
  'meta_analysis': 'Meta分析',
  'rct': '随机对照试验',
};