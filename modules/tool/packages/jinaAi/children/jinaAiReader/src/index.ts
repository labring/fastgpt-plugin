import { z } from 'zod';

// 输入参数类型定义
export const InputType = z.object({
  url: z.string().url('请提供有效的URL地址').describe('要提取内容的网页URL'),
  apiKey: z.string().describe('Jina AI API密钥'),
  timeout: z.number().min(1).max(300).optional().describe('请求超时时间（秒），默认30秒'),
  returnFormat: z
    .enum(['default', 'markdown', 'html', 'text', 'screenshot', 'pageshot'])
    .optional()
    .describe('内容返回格式，默认default')
});

// 输出结果类型定义
export const OutputType = z
  .object({
    code: z.number().describe('响应状态码'),
    title: z.string().describe('网页标题'),
    description: z.string().describe('网页描述'),
    url: z.string().describe('页面URL'),
    content: z.string().describe('网页内容')
  })
  .describe('Jina AI Reader API的响应内容');

/**
 * 验证API密钥格式
 */
const validateApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('jina_') && apiKey.length >= 25;
};

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
    'User-Agent': 'FastGPT-JinaAI-Plugin/0.1.0'
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
function processResponse(response: Response, responseText: string, returnFormat: string): any {
  const contentType = response.headers.get('content-type') || '';

  // 尝试解析JSON
  if (contentType.includes('application/json')) {
    try {
      const jsonData = JSON.parse(responseText);

      // 如果是Jina AI的标准响应格式
      if (jsonData.code === 200 && jsonData.status === 20000 && jsonData.data) {
        // 根据returnFormat确定要提取的内容字段
        const content = (() => {
          switch (returnFormat) {
            case 'html':
              return jsonData.data.html || '';
            case 'text':
              return jsonData.data.text || '';
            case 'screenshot':
              return jsonData.data.screenshotUrl || '';
            case 'pageshot':
              return jsonData.data.pageshotUrl || '';
            case 'markdown':
            case 'default':
            default:
              return jsonData.data.content || '';
          }
        })();

        return {
          code: jsonData.code || 200,
          title: jsonData.data.title || '',
          description: jsonData.data.description || '',
          url: jsonData.data.url || '',
          content: content
        };
      }

      // 其他JSON格式的处理
      return {
        code: jsonData.code || 200,
        title: jsonData.title || '',
        description: jsonData.description || '',
        url: jsonData.url || '',
        content: jsonData.content || JSON.stringify(jsonData)
      };
    } catch (error) {
      console.warn('JSON解析失败，返回原始文本:', error);
      return {
        code: 200,
        title: '',
        description: '',
        url: '',
        content: responseText
      };
    }
  }

  // 非JSON内容返回包装对象
  return {
    code: 200,
    title: '',
    description: '',
    url: '',
    content: responseText
  };
}

/**
 * 网页内容提取（递归重试机制）
 */
async function extractWebContent(
  url: string,
  apiKey: string,
  timeout: number,
  returnFormat: string,
  retry: number = 3
): Promise<any> {
  if (retry <= 0) {
    return Promise.reject(new Error('网页内容提取失败，已达到最大重试次数'));
  }

  const jinaUrl = buildJinaUrl(url);
  const headers = buildHeaders(apiKey, timeout, returnFormat);

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
        return Promise.reject(
          new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
        );
      }

      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') {
        return Promise.reject(new Error('服务器返回空响应'));
      }

      return processResponse(response, responseText, returnFormat);
    } catch (error) {
      clearTimeout(timeoutId);
      return Promise.reject(error);
    }
  } catch (error) {
    console.error(`Jina Reader尝试失败，剩余重试次数: ${retry - 1}`, {
      error: error instanceof Error ? error.message : String(error),
      url: url.substring(0, 100) + (url.length > 100 ? '...' : '')
    });

    // 简单重试延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 递归重试
    return extractWebContent(url, apiKey, timeout, returnFormat, retry - 1);
  }
}

/**
 * Jina AI Reader 工具主函数
 */
export async function tool(
  props: z.infer<typeof InputType>
): Promise<{ code: number; title: string; description: string; url: string; content: string }> {
  const { url, apiKey, timeout = 30, returnFormat = 'default' } = props;

  // 添加API密钥格式验证
  if (!validateApiKey(apiKey)) {
    return Promise.reject(new Error('API密钥格式无效，请确保使用以"jina_"开头的有效密钥'));
  }

  try {
    // 执行网页内容提取
    const result = await extractWebContent(url, apiKey, timeout, returnFormat);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '网页内容提取过程中发生未知错误';
    return Promise.reject(new Error(errorMessage));
  }
}
