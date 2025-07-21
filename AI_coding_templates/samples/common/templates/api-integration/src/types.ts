// API响应的基础类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: string | number;
  metadata?: ResponseMetadata;
}

// API错误类型
export interface ApiError {
  code: string | number;
  message: string;
  details?: any;
}

// 请求配置类型
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// API客户端配置
export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  defaultHeaders?: Record<string, string>;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 元数据类型
export interface ResponseMetadata {
  requestId?: string;
  timestamp: string;
  processingTime: number;
  rateLimit?: {
    remaining: number;
    reset: number;
    limit: number;
  };
  apiVersion?: string;
}