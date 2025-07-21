/**
 * FastGPT 插件通用类型定义
 * 用于替代 @fastgpt/global 包中的类型定义
 */

// 输入字段类型
export type PluginInputType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'textarea' 
  | 'file' 
  | 'object' 
  | 'array';

// 输出字段类型
export type PluginOutputType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array';

// 选项接口
export interface PluginOption {
  label: string;
  value: string | number | boolean;
}

// 输入字段配置
export interface PluginInputConfig {
  key: string;
  label: string;
  description?: string;
  type: PluginInputType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: PluginOption[];
  accept?: string; // 文件类型限制
  multiple?: boolean; // 是否支持多选/多文件
}

// 输出字段配置
export interface PluginOutputConfig {
  key: string;
  label: string;
  description?: string;
  type: PluginOutputType;
}

// 工具配置
export interface ToolConfig {
  customHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number; // 时间窗口（毫秒）
  };
  cache?: {
    enabled: boolean;
    ttl: number; // 缓存时间（毫秒）
  };
}

// 插件版本信息
export interface PluginVersion {
  version: string;
  updateTime: string;
  description: string;
  inputs: PluginInputConfig[];
  outputs: PluginOutputConfig[];
  deprecated?: boolean;
  breaking?: boolean;
}

// 插件配置主接口
export interface PluginConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  author?: string;
  version: string;
  documentUrl?: string;
  updateTime: string;
  tags?: string[];
  category?: string;
  
  // 工具配置
  toolConfig?: ToolConfig;
  
  // 版本列表
  versionList: PluginVersion[];
  
  // 权限配置
  permissions?: {
    network?: boolean;
    filesystem?: boolean;
    environment?: boolean;
  };
  
  // 依赖配置
  dependencies?: {
    required?: string[];
    optional?: string[];
  };
}

// 插件执行上下文
export interface PluginContext {
  userId?: string;
  teamId?: string;
  appId?: string;
  chatId?: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}

// 插件执行结果
export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    cacheHit?: boolean;
    source?: string;
    [key: string]: any;
  };
}

// 插件处理函数类型
export type PluginHandler = (
  input: Record<string, any>,
  context?: PluginContext
) => Promise<PluginResult>;

// 插件错误类型
export class PluginError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: any;

  constructor(message: string, code: string = 'PLUGIN_ERROR', statusCode?: number, details?: any) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 常用错误代码
export const PluginErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
} as const;