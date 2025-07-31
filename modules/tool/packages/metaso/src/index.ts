/**
 * Metaso 插件共享模块
 * 导出所有 API 客户端、类型定义、配置管理和工具函数
 */

// 导出类型定义
export type {
  MetasoConfig,
  SearchScope,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  AskRequest,
  AskResponse,
  ReaderRequest,
  ReaderResponse,
  ApiResponse,
  ErrorResponse,
  ToolOutput,
  SearchToolOutput,
  AskToolOutput,
  ReaderToolOutput
} from './types';

// 导出 API 客户端
export { MetasoApiClient, createMetasoClient } from './api';

// 导出配置管理
export { METASO_ENVIRONMENTS, getMetasoConfig, validateApiKey, getConfigFromEnv } from './config';

// 导出工具函数
export {
  formatSearchOutput,
  formatAskOutput,
  formatReaderOutput,
  truncateText,
  formatUrl,
  validateSearchQuery,
  validateUrl,
  generateSearchSummary
} from './utils';
