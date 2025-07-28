import type {
  MetasoConfig,
  ErrorResponse,
  SearchRequest,
  SearchResponse,
  AskRequest,
  AskResponse,
  ReaderRequest,
  ReaderResponse,
  SearchResultItem
} from './types';

/**
 * Metaso API 客户端
 * 提供搜索、问答和网页读取功能的统一调用方法
 */
export class MetasoApiClient {
  private config: MetasoConfig;

  constructor(config: MetasoConfig) {
    this.config = config;
  }

  /**
   * 通用 API 请求方法
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
      Accept: 'application/json'
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      requestOptions.signal = controller.signal;

      // 增加请求日志
      console.log(`[Metaso API] 请求: ${options.method || 'GET'} ${url}`);
      if (options.body && typeof options.body === 'string') {
        console.log(`[Metaso API] 请求体:`, JSON.parse(options.body));
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      console.log(`[Metaso API] 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // 增强错误处理：先尝试获取响应文本，再尝试解析JSON
        let errorData: ErrorResponse;
        try {
          const responseText = await response.text();
          console.log(`[Metaso API] 错误响应文本:`, responseText);

          if (responseText) {
            try {
              const parsedError = JSON.parse(responseText);
              errorData = {
                code: parsedError.code || response.status,
                message: parsedError.message || parsedError.msg || response.statusText,
                error: parsedError.error
              };
            } catch (parseError) {
              // JSON 解析失败，使用响应文本作为错误信息
              errorData = {
                code: response.status,
                message: responseText || response.statusText
              };
            }
          } else {
            // 响应为空
            errorData = {
              code: response.status,
              message: response.statusText || `HTTP ${response.status} Error`
            };
          }
        } catch (readError) {
          // 读取响应失败
          console.error(`[Metaso API] 读取错误响应失败:`, readError);
          errorData = {
            code: response.status,
            message: response.statusText || `HTTP ${response.status} Error`
          };
        }

        const errorMessage = `API Error ${errorData.code}: ${errorData.message}`;
        console.error(`[Metaso API] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');

      // 对于 reader 接口，可能返回 text/plain
      if (contentType?.includes('text/plain')) {
        const textContent = await response.text();
        console.log(`[Metaso API] 文本响应长度: ${textContent.length} 字符`);
        return textContent as unknown as T;
      }

      // 默认处理 JSON 响应
      const responseText = await response.text();
      console.log(`[Metaso API] 响应内容长度: ${responseText.length} 字符`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Metaso API] JSON 解析失败:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      // 检查业务错误码（如果存在）
      if (data.code && data.code !== 0 && data.code !== 200) {
        const businessError = `Business Error ${data.code}: ${data.message || 'Unknown business error'}`;
        console.error(`[Metaso API] ${businessError}`);
        throw new Error(businessError);
      }

      console.log(`[Metaso API] 请求成功`);

      // 返回数据，优先返回 data 字段，否则返回整个响应
      return data.data || data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error?.name === 'AbortError') {
        const timeoutError = `Request timeout after ${this.config.timeout || 30000}ms`;
        console.error(`[Metaso API] ${timeoutError}`);
        throw new Error(timeoutError);
      }

      if (error instanceof Error) {
        console.error(`[Metaso API] 请求失败:`, error.message);
        throw error;
      }

      const unknownError = `Request failed: ${error}`;
      console.error(`[Metaso API] ${unknownError}`);
      throw new Error(unknownError);
    }
  }

  // ===== 搜索相关接口 =====

  /**
   * 搜索功能
   * @param request 搜索请求参数
   * @returns 搜索结果
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    // 设置默认值
    const searchParams = {
      q: request.q,
      scope: request.scope || 'webpage',
      includeSummary: request.includeSummary || false,
      size: request.size || '10'
    };

    const response = await this.request<any>('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });

    // 格式化响应数据
    return this.formatSearchResponse(response, searchParams);
  }

  /**
   * 格式化搜索响应
   */
  private formatSearchResponse(response: any, params: SearchRequest): SearchResponse {
    // 根据实际 API 响应格式调整 - Metaso API 返回的是 webpages 字段，不是 results
    const webpages = response.webpages || response.results || [];
    const results: SearchResultItem[] = Array.isArray(webpages)
      ? webpages.map((item: any) => ({
          title: item.title || '',
          url: item.url || item.link || '',
          snippet: item.snippet || item.description || item.content || '',
          summary: item.summary,
          publishTime: item.publishTime || item.publish_time || item.date,
          source: item.source || item.domain
        }))
      : Array.isArray(response)
        ? response.map((item: any) => ({
            title: item.title || '',
            url: item.url || item.link || '',
            snippet: item.snippet || item.description || item.content || '',
            summary: item.summary,
            publishTime: item.publishTime || item.publish_time || item.date,
            source: item.source || item.domain
          }))
        : [];

    return {
      results,
      total: response.total || results.length,
      query: params.q,
      scope: params.scope || 'webpage'
    };
  }

  // ===== 问答相关接口 =====

  /**
   * 问答功能
   * @param request 问答请求参数
   * @returns 问答结果
   */
  async ask(request: AskRequest): Promise<AskResponse> {
    // 设置默认值
    const askParams = {
      q: request.q,
      scope: request.scope || 'webpage'
    };

    const response = await this.request<any>('/api/v1/ask', {
      method: 'POST',
      body: JSON.stringify(askParams)
    });

    // 格式化响应数据
    return this.formatAskResponse(response, askParams);
  }

  /**
   * 格式化问答响应
   */
  private formatAskResponse(response: any, params: AskRequest): AskResponse {
    // Metaso Ask API 返回的是 OpenAI 格式的响应
    let answer = '';

    // 处理 OpenAI 格式的响应
    if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
      const choice = response.choices[0];
      answer = choice.message?.content || choice.text || '';
    } else {
      // 备用处理：直接从响应中提取
      answer = response.answer || response.content || '';
    }

    // Ask API 通常不返回 sources，但我们保留这个字段以防将来支持
    const sources: SearchResultItem[] = Array.isArray(response.sources)
      ? response.sources.map((item: any) => ({
          title: item.title || '',
          url: item.url || '',
          snippet: item.snippet || item.description || '',
          summary: item.summary,
          publishTime: item.publishTime || item.publish_time,
          source: item.source
        }))
      : [];

    return {
      answer,
      sources,
      query: params.q
    };
  }

  // ===== 网页读取相关接口 =====

  /**
   * 网页读取功能
   * @param request 网页读取请求参数
   * @returns 网页内容
   */
  async reader(request: ReaderRequest): Promise<ReaderResponse> {
    const response = await this.request<string>('/api/v1/reader', {
      method: 'POST',
      headers: {
        Accept: 'text/plain' // reader 接口返回纯文本
      },
      body: JSON.stringify(request)
    });

    // 如果响应是字符串，直接返回
    if (typeof response === 'string') {
      return {
        content: response,
        url: request.url
      };
    }

    // 如果响应是对象，提取内容
    const responseObj = response as any;
    return {
      content: responseObj.content || responseObj.text || '',
      title: responseObj.title,
      url: request.url
    };
  }
}

/**
 * 创建 Metaso API 客户端实例
 */
export function createMetasoClient(config: MetasoConfig): MetasoApiClient {
  return new MetasoApiClient(config);
}
