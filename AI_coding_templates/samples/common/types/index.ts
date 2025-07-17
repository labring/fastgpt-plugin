/**
 * 通用类型定义统一导出
 */

// 导出插件相关类型
export * from './plugin';

// 导出工具相关类型
export * from './tool';

// 导出FastGPT相关类型
export * from './fastgpt';

// 导出其他通用类型
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface PaginatedResponse<T = any> extends BaseResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  baseURL?: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'ttl';
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'text';
  output?: 'console' | 'file' | 'both';
  filename?: string;
}

export interface EnvironmentConfig {
  development: boolean;
  production: boolean;
  testing: boolean;
  apiUrl: string;
  logLevel: string;
}

// 常用工具类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
export type KeyOf<T> = keyof T;
export type ValueOf<T> = T[keyof T];
export type Entries<T> = [keyof T, T[keyof T]][];

// 函数类型
export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>;
export type SyncFunction<T = any, R = any> = (...args: T[]) => R;
export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export type Validator<T = any> = (value: T) => boolean | string;
export type Transformer<T = any, R = any> = (value: T) => R;

// 状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';
export type ProcessState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 时间相关类型
export interface TimeRange {
  start: Date | string;
  end: Date | string;
}

export interface Duration {
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
}

// 文件相关类型
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path?: string;
  url?: string;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  multiple: boolean;
  destination?: string;
}

// 数据库相关类型
export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

export interface UpdateOptions {
  where: Record<string, any>;
  data: Record<string, any>;
}

export interface DeleteOptions {
  where: Record<string, any>;
}

// 网络相关类型
export interface HttpMethod {
  GET: 'GET';
  POST: 'POST';
  PUT: 'PUT';
  DELETE: 'DELETE';
  PATCH: 'PATCH';
  HEAD: 'HEAD';
  OPTIONS: 'OPTIONS';
}

export interface RequestOptions {
  method: keyof HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// 验证相关类型
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: Validator;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

// 配置相关类型
export interface AppConfig {
  name: string;
  version: string;
  environment: EnvironmentConfig;
  api: RequestConfig;
  cache: CacheConfig;
  logging: LogConfig;
  features: Record<string, boolean>;
}

// 事件相关类型
export interface EventEmitter<T = any> {
  on(event: string, listener: EventHandler<T>): void;
  off(event: string, listener: EventHandler<T>): void;
  emit(event: string, data?: T): void;
  once(event: string, listener: EventHandler<T>): void;
}

// 存储相关类型
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// 队列相关类型
export interface QueueJob<T = any> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
}

export interface QueueOptions {
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// 监控相关类型
export interface Metrics {
  requests: number;
  errors: number;
  responseTime: number;
  uptime: number;
  memory: number;
  cpu: number;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  checks: Record<string, boolean>;
  metrics?: Metrics;
}