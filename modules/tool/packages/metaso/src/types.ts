/**
 * Metaso API 通用类型定义
 * 包含所有 API 接口的请求和响应类型
 */

// 基础配置类型
export interface MetasoConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

// 搜索范围枚举
export type SearchScope = 'webpage' | 'academic' | 'news' | 'all';

// ===== 搜索相关类型 =====

// 搜索请求
export interface SearchRequest {
  q: string; // 搜索查询
  scope?: SearchScope; // 搜索范围，默认 'webpage'
  includeSummary?: boolean; // 是否包含摘要，默认 false
  size?: string; // 返回结果数量，默认 '10'
}

// 搜索结果项
export interface SearchResultItem {
  title: string; // 标题
  url: string; // 链接
  snippet: string; // 摘要片段
  summary?: string; // AI 生成的摘要（当 includeSummary=true 时）
  publishTime?: string; // 发布时间
  source?: string; // 来源
}

// 搜索响应
export interface SearchResponse {
  results: SearchResultItem[];
  total?: number; // 总结果数
  query: string; // 原始查询
  scope: SearchScope; // 搜索范围
}

// ===== 问答相关类型 =====

// 问答请求
export interface AskRequest {
  q: string; // 问题
  scope?: SearchScope; // 搜索范围，默认 'webpage'
}

// 问答响应
export interface AskResponse {
  answer: string; // AI 生成的答案
  sources?: SearchResultItem[]; // 参考来源
  query: string; // 原始问题
}

// ===== 网页读取相关类型 =====

// 网页读取请求
export interface ReaderRequest {
  url: string; // 要读取的网页 URL
}

// 网页读取响应
export interface ReaderResponse {
  content: string; // 网页文本内容
  title?: string; // 网页标题
  url: string; // 原始 URL
}

// ===== 通用响应类型 =====

// API 响应基础结构
export interface ApiResponse<T = any> {
  code?: number;
  message?: string;
  data?: T;
}

// 错误响应
export interface ErrorResponse {
  code: number;
  message: string;
  error?: string;
}

// ===== 工具输出类型 =====

// 工具输出基础类型
export interface ToolOutput {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// 搜索工具输出
export interface SearchToolOutput extends ToolOutput {
  data?: {
    query: string;
    results: SearchResultItem[];
    total?: number;
    scope: SearchScope;
  };
}

// 问答工具输出
export interface AskToolOutput extends ToolOutput {
  data?: {
    question: string;
    answer: string;
    sources?: SearchResultItem[];
  };
}

// 网页读取工具输出
export interface ReaderToolOutput extends ToolOutput {
  data?: {
    url: string;
    title?: string;
    content: string;
    contentLength: number;
  };
}
