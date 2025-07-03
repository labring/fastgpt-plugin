import { z } from 'zod';
import { getErrText } from '@tool/utils/err';

// 输入参数类型定义
export const InputType = z.object({
  url: z.string().url('请提供有效的URL地址').describe('要提取内容的网页URL'),
  apiKey: z.string().min(1, 'API密钥不能为空').describe('Jina AI API密钥'),
  timeout: z.number().min(1).max(300).optional().describe('请求超时时间（秒），默认30秒'),
  returnFormat: z
    .enum(['default', 'markdown', 'html', 'text', 'screenshot', 'pageshot'])
    .optional()
    .describe('内容返回格式，默认default')
});

// 输出结果类型定义
export const OutputType = z.any().describe('Jina AI Reader API的响应内容');

/**
 * 验证URL格式
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证API密钥格式
 */
function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('jina_') && apiKey.length >= 25;
}

/**
 * 构建Jina Reader请求URL
 */
function buildJinaUrl(targetUrl: string): string {
  return `https://r.jina.ai/${targetUrl}`;
}

/**
 * 构建请求头
 */
function buildHeaders(
  apiKey: string,
  timeout: number,
  returnFormat: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'X-Timeout': timeout.toString(),
    'User-Agent': 'FastGPT-JinaAI-Plugin/2.0.0'
  };

  // 根据格式设置X-Return-Format头
  if (returnFormat !== 'default') {
    headers['X-Return-Format'] = returnFormat;
  }

  return headers;
}

/**
 * 处理响应内容
 */
function processResponse(response: Response, responseText: string): any {
  const contentType = response.headers.get('content-type') || '';

  // 尝试解析JSON
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.warn('JSON解析失败，返回原始文本:', error);
      return { content: responseText, type: 'text' };
    }
  }

  // 非JSON内容返回包装对象
  return { content: responseText, type: 'raw' };
}

/**
 * 网页内容提取（带重试机制）
 */
async function extractWebContent(
  url: string,
  apiKey: string,
  timeout: number,
  returnFormat: string,
  maxRetries: number = 2
): Promise<any> {
  const jinaUrl = buildJinaUrl(url);
  const headers = buildHeaders(apiKey, timeout, returnFormat);
  let lastError: Error = new Error('未知错误');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (timeout + 10) * 1000);

      try {
        const response = await fetch(jinaUrl, {
          method: 'GET',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          throw new Error('服务器返回空响应');
        }

        return processResponse(response, responseText);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(`Jina Reader尝试 ${attempt}/${maxRetries} 失败:`, {
        attempt,
        error: lastError.message,
        url: url.substring(0, 100) + (url.length > 100 ? '...' : '')
      });

      if (attempt === maxRetries) {
        break;
      }

      // 简单重试延迟
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(
    `网页内容提取失败，已达到最大重试次数(${maxRetries})。最后错误: ${lastError.message}`
  );
}

/**
 * Jina AI Reader 工具主函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<any> {
  try {
    // 使用 zod 进行参数验证
    const validatedProps = InputType.parse(props);
    const { url, apiKey, timeout = 30, returnFormat = 'default' } = validatedProps;

    // 额外的URL格式验证
    if (!isValidUrl(url)) {
      throw new Error('URL格式不正确，请提供有效的HTTP/HTTPS网页地址');
    }

    // 额外的API密钥格式验证
    if (!validateApiKey(apiKey)) {
      throw new Error('API密钥格式无效，请确保使用以"jina_"开头的有效密钥');
    }

    // 执行网页内容提取
    const result = await extractWebContent(url, apiKey, timeout, returnFormat);
    return result;
  } catch (error) {
    // 统一错误处理
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      throw new Error(`参数验证失败: ${errorMessages}`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(getErrText(error, '网页内容提取过程中发生未知错误'));
  }
}
