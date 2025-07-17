/**
 * 检索工具相关类型定义
 */

// 检索工具输入
export interface SearchToolInput {
  query: string;
  maxResults?: number;
}

// 检索工具输出
export interface SearchToolOutput {
  success: boolean;
  questionId?: string;
  results?: SearchResult[];
  totalCount?: number;
  message?: string;
}

// 检索结果
export interface SearchResult {
  id: string;
  title: string;
  type: string;
  summary?: string;
}

// 检索结果摘要
export interface SearchSummary {
  totalCount: number;
  query: string;
}