// 导出所有工具类
export { InputValidator, ValidationSchemaFactory } from './validation';
export { DataCleaner } from './data-cleaner';
export { TextFormatter } from './formatter';
export { DataConverter } from './data-converter';
export { AsyncUtils } from './async-utils';
export { MemoryCache, LRUCache, CacheManager, globalCacheManager, cached } from './cache';

// 常用工具函数
export * from './common-helpers';

// 类型定义
export interface UtilsConfig {
  cache?: {
    maxSize?: number;
    defaultTTL?: number;
  };
  async?: {
    defaultTimeout?: number;
    defaultRetries?: number;
    defaultConcurrency?: number;
  };
  validation?: {
    strictMode?: boolean;
    customValidators?: Record<string, (value: any) => boolean>;
  };
}

// 默认配置
export const defaultUtilsConfig: UtilsConfig = {
  cache: {
    maxSize: 1000,
    defaultTTL: 300000 // 5分钟
  },
  async: {
    defaultTimeout: 30000, // 30秒
    defaultRetries: 3,
    defaultConcurrency: 5
  },
  validation: {
    strictMode: false,
    customValidators: {}
  }
};

// 工具类初始化函数
export function initializeUtils(config: Partial<UtilsConfig> = {}): void {
  const mergedConfig = { ...defaultUtilsConfig, ...config };

  // 这里可以根据配置初始化全局设置
  console.log('工具类已初始化，配置:', mergedConfig);
}
