import axios, { type AxiosInstance, AxiosError } from 'axios';

const TAVILY_API_BASE = 'https://api.tavily.com';

/**
 * Tavily API 错误类型
 */
export enum TavilyErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 创建 Tavily HTTP 客户端
 */
export function createTavilyClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: TAVILY_API_BASE,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });
}

/**
 * 验证 API Key 格式
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Tavily API key is required');
  }

  if (!apiKey.startsWith('tvly-')) {
    throw new Error('Invalid Tavily API key format. Key should start with "tvly-"');
  }

  if (apiKey.length < 20) {
    throw new Error('Invalid Tavily API key format. Key is too short');
  }
}

/**
 * 错误处理函数
 */
export function handleTavilyError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const errorMessage = axiosError.response.data?.error || axiosError.message;

      switch (status) {
        case 401:
          return `Authentication failed: Invalid Tavily API key. ${errorMessage}`;
        case 403:
          return `Access forbidden: ${errorMessage}`;
        case 429:
          return `Rate limit exceeded: ${errorMessage}. Please wait before making more requests.`;
        case 400:
          return `Invalid request: ${errorMessage}`;
        case 500:
        case 502:
        case 503:
          return `Tavily server error: ${errorMessage}. Please try again later.`;
        default:
          return `Tavily API error (${status}): ${errorMessage}`;
      }
    }

    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your network connection.';
    }

    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      return 'Network error: Cannot reach Tavily API. Please check your internet connection.';
    }

    return `Network error: ${axiosError.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error occurred while calling Tavily API';
}

/**
 * 获取错误类型
 */
export function getErrorType(error: unknown): TavilyErrorType {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;

      if (status === 401 || status === 403) return TavilyErrorType.AUTH_ERROR;
      if (status === 429) return TavilyErrorType.RATE_LIMIT;
      if (status === 400) return TavilyErrorType.INVALID_REQUEST;
      if (status >= 500) return TavilyErrorType.SERVER_ERROR;
    }

    if (axiosError.code === 'ECONNABORTED') return TavilyErrorType.TIMEOUT;
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      return TavilyErrorType.NETWORK_ERROR;
    }
  }

  return TavilyErrorType.UNKNOWN;
}
