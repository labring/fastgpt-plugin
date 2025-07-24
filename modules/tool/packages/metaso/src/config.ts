import type { MetasoConfig } from './types';

/**
 * Metaso 配置管理
 * 提供环境配置和 API 密钥管理
 */

// 环境配置
export const METASO_ENVIRONMENTS = {
  production: {
    baseUrl: 'https://metaso.cn'
  }
} as const;

/**
 * 获取 Metaso 配置
 * @param apiKey API 密钥
 * @param environment 环境，默认为 production
 * @param timeout 请求超时时间（毫秒），默认 30000
 * @returns Metaso 配置对象
 */
export function getMetasoConfig(
  apiKey: string,
  environment: keyof typeof METASO_ENVIRONMENTS = 'production',
  timeout: number = 30000
): MetasoConfig {
  if (!apiKey) {
    throw new Error('Metaso API key is required');
  }

  if (!apiKey.startsWith('mk-')) {
    throw new Error('Invalid Metaso API key format. API key should start with "mk-"');
  }

  const envConfig = METASO_ENVIRONMENTS[environment];
  if (!envConfig) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  return {
    apiKey,
    baseUrl: envConfig.baseUrl,
    timeout
  };
}

/**
 * 验证 API 密钥格式
 * @param apiKey API 密钥
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.startsWith('mk-') && apiKey.length > 10;
}

/**
 * 从环境变量获取配置
 * @returns Metaso 配置对象或 null
 */
export function getConfigFromEnv(): MetasoConfig | null {
  const apiKey = process.env.METASO_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    return getMetasoConfig(apiKey);
  } catch (error) {
    console.warn('Failed to get Metaso config from environment:', error);
    return null;
  }
}
