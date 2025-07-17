import type { KnowsConfig } from './types';

/**
 * KnowS 配置管理
 * 提供环境配置和 API 密钥管理
 */

// 环境配置
export const KNOWS_ENVIRONMENTS = {
  development: {
    baseUrl: 'https://dev-api.nullht.com',
    defaultApiKey: 'c0970d9fe46345ecbf8b6d35b230d45e',
  },
  production: {
    baseUrl: 'https://api.nullht.com',
    defaultApiKey: 'a6d9ce8081ac4d8cbcd772adafb75bca',
  },
} as const;

/**
 * 获取配置
 */
export function getKnowsConfig(
  apiKey?: string,
  environment: 'development' | 'production' = 'production',
  timeout: number = 30000
): KnowsConfig {
  const env = KNOWS_ENVIRONMENTS[environment];
  
  return {
    apiKey: apiKey || env.defaultApiKey,
    baseUrl: env.baseUrl,
    timeout,
  };
}

/**
 * 验证配置
 */
export function validateConfig(config: KnowsConfig): { valid: boolean; error?: string } {
  if (!config.apiKey) {
    return { valid: false, error: 'API Key is required' };
  }
  
  if (!config.baseUrl) {
    return { valid: false, error: 'Base URL is required' };
  }
  
  try {
    new URL(config.baseUrl);
  } catch {
    return { valid: false, error: 'Invalid Base URL format' };
  }
  
  return { valid: true };
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: KnowsConfig = getKnowsConfig();