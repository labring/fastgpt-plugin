/**
 * 搜索请求参数
 */
export interface SearchRequest {
  api_key: string;
  query: string;
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  include_answer?: boolean;
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  query: string;
  answer?: string;
  results: SearchResult[];
  images?: Array<{
    url: string;
    description: string;
  }>;
  response_time: number;
  request_id: string;
}

/**
 * 提取请求参数
 */
export interface ExtractRequest {
  api_key: string;
  urls: string | string[];
  format?: 'markdown' | 'text';
}

/**
 * 提取结果项
 */
export interface ExtractResult {
  url: string;
  raw_content: string;
  images?: string[];
}

/**
 * 提取响应
 */
export interface ExtractResponse {
  results: ExtractResult[];
  failed_results?: Array<{
    url: string;
    error: string;
  }>;
  response_time: number;
  request_id: string;
}
