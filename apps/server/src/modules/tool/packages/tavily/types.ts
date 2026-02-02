/**
 * 搜索请求参数
 */
export interface SearchRequest {
  api_key: string;
  query: string;
  auto_parameters?: boolean;
  topic?: 'general' | 'news' | 'finance';
  search_depth?: 'basic' | 'advanced';
  chunks_per_source?: number;
  max_results?: number;
  time_range?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
  start_date?: string;
  end_date?: string;
  include_answer?: boolean | 'basic' | 'advanced';
  include_raw_content?: boolean | 'markdown' | 'text';
  include_images?: boolean;
  include_image_descriptions?: boolean;
  include_favicon?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
  country?: string;
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
  extract_depth?: 'basic' | 'advanced';
  include_images?: boolean;
  include_favicon?: boolean;
  timeout?: number;
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

/**
 * 爬取请求参数
 */
export interface CrawlRequest {
  api_key: string;
  url: string;
  instructions?: string;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  include_images?: boolean;
  extract_depth?: 'basic' | 'advanced';
  format?: 'markdown' | 'text';
  include_favicon?: boolean;
  timeout?: number;
}

/**
 * 爬取结果项
 */
export interface CrawlResult {
  url: string;
  raw_content: string;
  favicon?: string;
}

/**
 * 爬取响应
 */
export interface CrawlResponse {
  base_url: string;
  results: CrawlResult[];
  response_time: number;
  request_id: string;
}

/**
 * 映射请求参数
 */
export interface MapRequest {
  api_key: string;
  url: string;
  instructions?: string;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  timeout?: number;
}

/**
 * 映射响应
 */
export interface MapResponse {
  base_url: string;
  results: string[];
  response_time: number;
  request_id: string;
}
