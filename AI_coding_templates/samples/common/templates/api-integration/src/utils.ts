import type { ApiClientConfig, RequestConfig, ApiError } from './types';

/**
 * 延迟函数 - 用于重试机制
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 指数退避重试函数
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // 指数退避：1s, 2s, 4s, 8s...
      const delayTime = baseDelay * Math.pow(2, attempt);
      await delay(delayTime);
    }
  }
  
  throw lastError!;
}

/**
 * 构建查询字符串
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T = any>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * 创建API错误
 */
export function createApiError(
  message: string,
  code?: string | number,
  details?: any
): ApiError {
  return {
    code: code || 'UNKNOWN_ERROR',
    message,
    details
  };
}

/**
 * 检查是否为API错误响应
 */
export function isApiError(response: any): response is ApiError {
  return response && typeof response.code !== 'undefined' && typeof response.message === 'string';
}

/**
 * 格式化错误消息
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (isApiError(error)) {
    return `API错误 [${error.code}]: ${error.message}`;
  }
  
  return '发生未知错误';
}

/**
 * 验证API密钥格式
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // 基本长度检查（根据实际API调整）
  if (apiKey.length < 10) {
    return false;
  }
  
  // 检查是否包含非法字符（根据实际API调整）
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(apiKey);
}

/**
 * 清理敏感信息用于日志记录
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'authorization'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***';
    }
  });
  
  return sanitized;
}

/**
 * 获取错误状态码对应的消息
 */
export function getHttpErrorMessage(status: number): string {
  const errorMessages: Record<number, string> = {
    400: '请求参数错误',
    401: 'API密钥无效或已过期',
    403: '访问被拒绝，请检查权限',
    404: '请求的资源不存在',
    429: '请求频率过高，请稍后重试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  };
  
  return errorMessages[status] || `HTTP错误 ${status}`;
}