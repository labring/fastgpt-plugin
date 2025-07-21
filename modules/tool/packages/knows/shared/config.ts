import type { KnowsConfig } from './types';

/**
 * KnowS 配置管理
 * 提供环境配置和 API 密钥管理
 */

// 环境配置
export const KNOWS_ENVIRONMENTS = {
  development: {
    baseUrl: 'https://dev-api.nullht.com'
  },
  production: {
    baseUrl: 'https://api.nullht.com'
  }
} as const;

/**
 * 获取 KnowS 配置
 * @param apiKey - API 密钥（必填）
 * @param environment - 环境配置
 * @param timeout - 超时时间
 */
export function getKnowsConfig(
  apiKey: string,
  environment: 'development' | 'production' = 'production',
  timeout: number = 30000
): KnowsConfig {
  if (!apiKey) {
    throw new Error('API Key 是必填项，请在工具配置中输入有效的 KnowS API Key');
  }

  const env = KNOWS_ENVIRONMENTS[environment];

  return {
    apiKey,
    baseUrl: env.baseUrl,
    timeout
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
