import type { StreamResponse, ToolOutput } from './types';

/**
 * KnowS 通用工具函数
 */

/**
 * 解析流式响应
 */
export async function parseStreamResponse(
  response: Response,
  onData?: (data: StreamResponse) => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<StreamResponse[]> {
  const results: StreamResponse[] = [];

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onEnd?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.slice(5).trim();
            if (jsonStr) {
              const data: StreamResponse = JSON.parse(jsonStr);
              results.push(data);
              onData?.(data);

              // 检查是否是结束标记
              if (data.data.type === 'END') {
                onEnd?.();
                return results;
              }
            }
          } catch (error) {
            console.warn('Failed to parse stream data:', line, error);
          }
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  } finally {
    reader.releaseLock();
  }

  return results;
}

/**
 * 创建成功的工具输出
 */
export function createSuccessOutput(data: any, message?: string): ToolOutput {
  return {
    success: true,
    data,
    message
  };
}

/**
 * 创建错误的工具输出
 */
export function createErrorOutput(error: string | Error, data?: any): ToolOutput {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    success: false,
    error: errorMessage,
    data
  };
}

/**
 * 格式化证据标签
 */
export function formatEvidenceLabels(labels: string[]): string {
  if (!labels || labels.length === 0) {
    return '';
  }

  return labels.join(' | ');
}

/**
 * 格式化证据信息
 */
export function formatEvidence(evidence: any): any {
  if (!evidence) return evidence;

  return {
    ...evidence,
    formatted_date: evidence.publish_date ? formatDate(evidence.publish_date) : '',
    truncated_abstract: evidence.abstract ? truncateText(evidence.abstract, 200) : '',
    formatted_labels: evidence.labels ? formatEvidenceLabels(evidence.labels) : ''
  };
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * 验证证据 ID 格式
 */
export function isValidEvidenceId(id: string): boolean {
  // 假设证据 ID 是 32 位十六进制字符串
  return /^[a-f0-9]{32}$/i.test(id);
}

/**
 * 验证问题 ID 格式
 */
export function isValidQuestionId(id: string): boolean {
  // 问题 ID 可能有不同格式，这里做基本验证
  return typeof id === 'string' && id.length > 0;
}

/**
 * 提取引用 ID
 */
export function extractCitationIds(content: string): string[] {
  const regex = /\{([a-f0-9]{32})\}/gi;
  const matches = content.match(regex);

  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(1, -1)); // 移除大括号
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await delay(delayMs * attempt); // 指数退避
    }
  }

  throw lastError!;
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(jsonStr: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

/**
 * 检查是否为空值
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
