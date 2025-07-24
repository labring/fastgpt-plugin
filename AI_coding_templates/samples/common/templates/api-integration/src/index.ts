import { z } from 'zod';
import type { ApiResponse, ApiClientConfig, RequestConfig, ResponseMetadata } from './types';
import {
  retryWithBackoff,
  buildQueryString,
  isValidUrl,
  safeJsonParse,
  createApiError,
  formatErrorMessage,
  validateApiKey,
  sanitizeForLogging,
  getHttpErrorMessage
} from './utils';

// 输入类型定义
export const InputType = z.object({
  apiKey: z.string().min(1, 'API密钥不能为空'),
  baseUrl: z.string().url('基础URL格式不正确').optional().default('https://api.example.com'),
  query: z.string().min(1, '查询内容不能为空'),
  limit: z.number().int().min(1).max(100).optional().default(10),
  options: z.string().optional().default('{}')
});

// 输出类型定义
export const OutputType = z.object({
  result: z.string(),
  metadata: z.object({
    requestId: z.string().optional(),
    timestamp: z.string(),
    processingTime: z.number(),
    rateLimit: z
      .object({
        remaining: z.number(),
        reset: z.number(),
        limit: z.number()
      })
      .optional(),
    apiVersion: z.string().optional()
  }),
  rawResponse: z.any()
});

/**
 * API客户端类
 */
class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'FastGPT-Plugin/1.0'
      },
      ...config
    };
  }

  /**
   * 发送HTTP请求
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      // 构建完整URL
      const url = new URL(endpoint, this.config.baseUrl);

      // 准备请求配置
      const requestConfig: RequestInit = {
        method: config.method || 'GET',
        headers: {
          ...this.config.defaultHeaders,
          Authorization: `Bearer ${this.config.apiKey}`,
          ...config.headers
        },
        signal: AbortSignal.timeout(config.timeout || this.config.timeout!)
      };

      // 记录请求日志（不包含敏感信息）
      console.log('API请求:', {
        url: url.toString(),
        method: requestConfig.method,
        headers: sanitizeForLogging(requestConfig.headers)
      });

      // 发送请求（带重试机制）
      const response = await retryWithBackoff(
        () => fetch(url.toString(), requestConfig),
        config.retries || this.config.retries!,
        config.retryDelay || 1000
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text();
        const errorData = safeJsonParse(errorText, { message: errorText });

        throw createApiError(getHttpErrorMessage(response.status), response.status, errorData);
      }

      // 解析响应数据
      const responseText = await response.text();
      const data = safeJsonParse<T>(responseText, responseText as any);

      // 提取响应元数据
      const metadata: ResponseMetadata = {
        requestId: response.headers.get('x-request-id') || undefined,
        timestamp: new Date().toISOString(),
        processingTime,
        apiVersion: response.headers.get('x-api-version') || undefined
      };

      // 提取速率限制信息
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      const rateLimitLimit = response.headers.get('x-ratelimit-limit');

      if (rateLimitRemaining && rateLimitReset && rateLimitLimit) {
        metadata.rateLimit = {
          remaining: parseInt(rateLimitRemaining),
          reset: parseInt(rateLimitReset),
          limit: parseInt(rateLimitLimit)
        };
      }

      return {
        success: true,
        data,
        metadata
      };
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.error('API请求失败:', {
        endpoint,
        error: formatErrorMessage(error),
        processingTime
      });

      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const queryString = buildQueryString(params);
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    } as any);
  }
}

/**
 * API集成工具核心处理函数
 *
 * @param props 输入参数
 * @returns 处理结果
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const { apiKey, baseUrl, query, limit, options } = props;

    // 验证API密钥
    if (!validateApiKey(apiKey)) {
      throw new Error('API密钥格式不正确');
    }

    // 验证基础URL
    if (!isValidUrl(baseUrl)) {
      throw new Error('基础URL格式不正确');
    }

    // 解析高级选项
    let parsedOptions: Record<string, any> = {};
    if (options && options.trim()) {
      try {
        parsedOptions = JSON.parse(options);
      } catch {
        throw new Error('高级选项必须是有效的JSON格式');
      }
    }

    // 创建API客户端
    const client = new ApiClient({
      baseUrl,
      apiKey,
      timeout: parsedOptions.timeout || 30000,
      retries: parsedOptions.retries || 3
    });

    // 构建请求参数
    const requestParams = {
      q: query,
      limit,
      ...parsedOptions.params
    };

    // 发送API请求
    const response = await client.get('/search', requestParams);

    // 处理响应数据
    let result: string;
    if (typeof response.data === 'string') {
      result = response.data;
    } else if (Array.isArray(response.data)) {
      // 如果返回数组，格式化为字符串
      result = response.data
        .map(
          (item, index) => `${index + 1}. ${typeof item === 'object' ? JSON.stringify(item) : item}`
        )
        .join('\n');
    } else {
      // 如果返回对象，转换为JSON字符串
      result = JSON.stringify(response.data, null, 2);
    }

    return {
      result,
      metadata: response.metadata || {
        timestamp: new Date().toISOString(),
        processingTime: 0
      },
      rawResponse: response.data
    };
  } catch (error) {
    // 错误处理
    const errorMessage = formatErrorMessage(error);
    console.error('API集成工具处理失败:', errorMessage);

    throw new Error(`API集成工具处理失败: ${errorMessage}`);
  }
}

/**
 * 工具验证函数
 */
export async function validateTool(): Promise<boolean> {
  try {
    // 这里可以实现基本的连通性测试
    // 注意：实际验证时需要有效的API密钥
    return true;
  } catch {
    return false;
  }
}
