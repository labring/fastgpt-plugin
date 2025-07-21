/**
 * 工具相关类型定义
 * 用于替代 @tool 包中的类型定义
 */

import type { PluginConfig, PluginInputConfig, PluginOutputConfig } from './plugin';

// 工具类型枚举
export enum ToolTypeEnum {
  SIMPLE = 'simple',
  API_INTEGRATION = 'api_integration',
  DATA_PROCESSING = 'data_processing',
  FILE_PROCESSING = 'file_processing',
  SEARCH = 'search',
  CHAT = 'chat',
  DATASET = 'dataset',
  HTTP = 'http',
  CODE = 'code',
  PLUGIN = 'plugin',
  CUSTOM = 'custom'
}

// 工具定义接口
export interface ToolDefinition extends PluginConfig {
  type: ToolTypeEnum;
  handler: string; // 处理函数的路径
  schema?: {
    input?: any;
    output?: any;
  };
}

// 工具配置定义函数
export function defineTool(config: ToolDefinition): ToolDefinition {
  return {
    ...config,
    versionList: config.versionList || [{
      version: config.version,
      updateTime: config.updateTime,
      description: config.description,
      inputs: [],
      outputs: []
    }]
  };
}

// 输入配置定义函数
export function defineInputConfig(inputs: PluginInputConfig[]): PluginInputConfig[] {
  return inputs.map(input => ({
    ...input,
    required: input.required ?? false
  }));
}

// 输出配置定义函数
export function defineOutputConfig(outputs: PluginOutputConfig[]): PluginOutputConfig[] {
  return outputs;
}

// 工具导出函数
export function exportTool(definition: ToolDefinition) {
  return {
    config: definition,
    handler: definition.handler
  };
}

// 工具执行上下文
export interface ToolContext {
  userId?: string;
  teamId?: string;
  appId?: string;
  chatId?: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
  environment?: 'development' | 'production' | 'testing';
}

// 工具执行结果
export interface ToolResult {
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

// 工具处理函数类型
export type ToolHandler = (
  input: Record<string, any>,
  context?: ToolContext
) => Promise<ToolResult>;

// 工具验证器
export interface ToolValidator {
  validateInput(input: any): { valid: boolean; errors?: string[] };
  validateOutput(output: any): { valid: boolean; errors?: string[] };
}

// 工具中间件
export type ToolMiddleware = (
  input: Record<string, any>,
  context: ToolContext,
  next: () => Promise<ToolResult>
) => Promise<ToolResult>;

// 工具注册信息
export interface ToolRegistry {
  id: string;
  definition: ToolDefinition;
  handler: ToolHandler;
  validator?: ToolValidator;
  middleware?: ToolMiddleware[];
}

// 工具管理器
export interface ToolManager {
  register(definition: ToolDefinition, handler: ToolHandler): Promise<void>;
  unregister(toolId: string): Promise<void>;
  execute(toolId: string, input: Record<string, any>, context?: ToolContext): Promise<ToolResult>;
  getTool(toolId: string): ToolRegistry | undefined;
  listTools(): ToolRegistry[];
  addMiddleware(toolId: string, middleware: ToolMiddleware): void;
  removeMiddleware(toolId: string, middleware: ToolMiddleware): void;
}

// 工具错误类
export class ToolError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: any;

  constructor(message: string, code: string = 'TOOL_ERROR', statusCode?: number, details?: any) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 工具错误代码
export const ToolErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_OUTPUT: 'INVALID_OUTPUT',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;