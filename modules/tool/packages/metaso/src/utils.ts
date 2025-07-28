import type {
  SearchToolOutput,
  AskToolOutput,
  ReaderToolOutput,
  SearchResultItem,
  SearchResponse,
  AskResponse,
  ReaderResponse
} from './types';

/**
 * Metaso 通用工具函数
 */

/**
 * 格式化搜索结果为工具输出
 * @param response 搜索响应
 * @param error 错误信息（可选）
 * @returns 格式化的工具输出
 */
export function formatSearchOutput(response?: SearchResponse, error?: string): SearchToolOutput {
  if (error) {
    return {
      success: false,
      error,
      message: `搜索失败: ${error}`
    };
  }

  if (!response) {
    return {
      success: false,
      error: 'No response received',
      message: '未收到搜索响应'
    };
  }

  return {
    success: true,
    message: `成功搜索到 ${response.results.length} 条结果`,
    data: {
      query: response.query,
      results: response.results,
      total: response.total,
      scope: response.scope
    }
  };
}

/**
 * 格式化问答结果为工具输出
 * @param response 问答响应
 * @param error 错误信息（可选）
 * @returns 格式化的工具输出
 */
export function formatAskOutput(response?: AskResponse, error?: string): AskToolOutput {
  if (error) {
    return {
      success: false,
      error,
      message: `问答失败: ${error}`
    };
  }

  if (!response) {
    return {
      success: false,
      error: 'No response received',
      message: '未收到问答响应'
    };
  }

  return {
    success: true,
    message: '问答成功',
    data: {
      question: response.query,
      answer: response.answer,
      sources: response.sources
    }
  };
}

/**
 * 格式化网页读取结果为工具输出
 * @param response 网页读取响应
 * @param error 错误信息（可选）
 * @returns 格式化的工具输出
 */
export function formatReaderOutput(response?: ReaderResponse, error?: string): ReaderToolOutput {
  if (error) {
    return {
      success: false,
      error,
      message: `网页读取失败: ${error}`
    };
  }

  if (!response) {
    return {
      success: false,
      error: 'No response received',
      message: '未收到网页读取响应'
    };
  }

  return {
    success: true,
    message: `成功读取网页内容，共 ${response.content.length} 字符`,
    data: {
      url: response.url,
      title: response.title,
      content: response.content,
      contentLength: response.content.length
    }
  };
}

/**
 * 截断文本内容
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number = 1000): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * 清理和格式化 URL
 * @param url 原始 URL
 * @returns 格式化的 URL
 */
export function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (_error) {
    // 如果不是有效的 URL，尝试添加协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      try {
        const urlWithProtocol = new URL(`https://${url}`);
        return urlWithProtocol.toString();
      } catch (_secondError) {
        // 如果仍然无效，返回原始 URL
        return url;
      }
    }
    return url;
  }
}

/**
 * 验证搜索查询
 * @param query 搜索查询
 * @returns 验证结果
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: '搜索查询不能为空' };
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return { valid: false, error: '搜索查询不能为空' };
  }

  if (trimmedQuery.length > 500) {
    return { valid: false, error: '搜索查询过长，最多支持 500 字符' };
  }

  return { valid: true };
}

/**
 * 验证 URL
 * @param url URL 字符串
 * @returns 验证结果
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL 不能为空' };
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return { valid: false, error: 'URL 不能为空' };
  }

  try {
    new URL(formatUrl(trimmedUrl));
    return { valid: true };
  } catch (_error) {
    return { valid: false, error: '无效的 URL 格式' };
  }
}

/**
 * 生成搜索结果摘要
 * @param results 搜索结果
 * @param maxResults 最大结果数
 * @returns 摘要文本
 */
export function generateSearchSummary(results: SearchResultItem[], maxResults: number = 5): string {
  if (results.length === 0) {
    return '未找到相关结果';
  }

  const displayResults = results.slice(0, maxResults);
  const summaryLines = displayResults.map((result, index) => {
    const title = truncateText(result.title, 50);
    const snippet = truncateText(result.snippet, 100);
    return `${index + 1}. ${title}\n   ${snippet}\n   来源: ${result.url}`;
  });

  let summary = summaryLines.join('\n\n');

  if (results.length > maxResults) {
    summary += `\n\n... 还有 ${results.length - maxResults} 条结果`;
  }

  return summary;
}
