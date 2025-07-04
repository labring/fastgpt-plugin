import { z } from 'zod';

// 输入参数类型定义
export const InputType = z.object({
  query: z.string().min(1, '搜索查询词不能为空').describe('搜索查询词'),
  apiKey: z.string().min(1, 'API密钥不能为空').describe('Jina AI API密钥'),
  country: z.string().optional().describe('搜索地区代码（如CN、US等）'),
  language: z.string().optional().describe('搜索语言代码（如zh-cn、en等）'),
  timeout: z.number().min(5).max(120).optional().describe('请求超时时间（秒）'),
  readFullContent: z.boolean().optional().describe('是否读取SERP的完整内容'),
  withFavicons: z.boolean().optional().describe('是否获取网站图标')
});

// 输出结果类型定义
export const OutputType = z.any().describe('Jina AI 搜索响应数据');

/**
 * 验证API密钥格式
 */
const validateApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('jina_') && apiKey.length >= 25;
};

/**
 * 构建搜索URL
 */
const buildSearchUrl = (query: string, country?: string, language?: string): string => {
  const baseUrl = 'https://s.jina.ai/';
  const params = new URLSearchParams({ q: query });

  if (country) params.append('gl', country);
  if (language) params.append('hl', language);

  return `${baseUrl}?${params.toString()}`;
};

/**
 * 带重试机制的 Jina AI 搜索执行函数
 */
const executeWithRetry = async (
  query: string,
  apiKey: string,
  country?: string,
  language?: string,
  timeout: number = 30,
  readFullContent: boolean = false,
  withFavicons: boolean = false,
  maxRetries: number = 3
): Promise<any> => {
  let lastError: Error = new Error('未知错误'); // 初始化默认错误

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const searchUrl = buildSearchUrl(query, country, language);

      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Timeout': timeout.toString(),
        'User-Agent': 'FastGPT-JinaAI-Plugin/1.0.0'
      };

      // 根据readFullContent设置引擎模式
      if (readFullContent) {
        headers['X-Engine'] = 'direct';
      } else {
        headers['X-Respond-With'] = 'no-content';
      }

      // 根据withFavicons设置图标获取
      if (withFavicons) {
        headers['X-With-Favicons'] = 'true';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      try {
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          return Promise.reject(
            new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`)
          );
        }

        const data = await response.json();

        // 验证响应数据结构
        if (!data || typeof data !== 'object') {
          return Promise.reject(new Error('Invalid response format from Jina AI API'));
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        return Promise.reject(error);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(`Jina AI搜索尝试 ${attempt}/${maxRetries} 失败:`, {
        attempt,
        error: lastError.message,
        query: query.substring(0, 50) + (query.length > 50 ? '...' : '')
      });

      if (attempt === maxRetries) {
        break;
      }

      // 指数退避重试策略，增加随机抖动
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return Promise.reject(
    new Error(`搜索请求失败，已达到最大重试次数(${maxRetries})。最后错误: ${lastError.message}`)
  );
};

/**
 * Jina AI 搜索工具主函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<any> {
  const {
    query,
    apiKey,
    country,
    language,
    timeout = 30,
    readFullContent = false,
    withFavicons = false
  } = props;

  // 额外的API密钥格式验证
  if (!validateApiKey(apiKey)) {
    return Promise.reject(new Error('API密钥格式无效，请确保使用以"jina_"开头的有效密钥'));
  }

  // 清理查询词
  const cleanQuery = query.trim();
  if (cleanQuery.length === 0) {
    return Promise.reject(new Error('搜索查询词不能为空或仅包含空白字符'));
  }

  // 执行搜索
  try {
    const result = await executeWithRetry(
      cleanQuery,
      apiKey,
      country,
      language,
      timeout,
      readFullContent,
      withFavicons
    );
    return result;
  } catch (error) {
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error(`未知错误: ${String(error)}`));
  }
}
