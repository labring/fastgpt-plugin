import { z } from 'zod';
import { createTavilyClient, handleTavilyError, validateApiKey } from '../../../client';
import type { MapRequest, MapResponse } from '../../../types';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  tavilyApiKey: z.string().min(1, 'Tavily API key is required'),
  url: z.string().min(1, 'URL is required'),
  instructions: z.string().optional(),
  maxDepth: z.number().int().min(1).max(5).default(1),
  maxBreadth: z.number().int().min(1).default(20),
  limit: z.number().int().min(1).default(50),
  selectPaths: z.string().optional(),
  selectDomains: z.string().optional(),
  excludePaths: z.string().optional(),
  excludeDomains: z.string().optional(),
  allowExternal: z.boolean().default(true),
  timeout: z.number().min(10).max(150).default(150)
});

// 输出类型
export const OutputType = z.object({
  baseUrl: z.string(),
  results: z.array(z.string()).default([]),
  urlCount: z.number(),
  responseTime: z.number()
});

export async function tool({
  tavilyApiKey,
  url,
  instructions,
  maxDepth,
  maxBreadth,
  limit,
  selectPaths,
  selectDomains,
  excludePaths,
  excludeDomains,
  allowExternal,
  timeout
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 1. 验证 API Key
    validateApiKey(tavilyApiKey);

    // 2. 创建客户端
    const client = createTavilyClient(tavilyApiKey);

    // 3. 处理数组类型的参数
    const parseRegexPatterns = (input?: string): string[] | undefined => {
      if (!input) return undefined;

      return input
        .split('\n')
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern.length > 0);
    };

    // 4. 构建请求
    const requestBody: MapRequest = {
      api_key: tavilyApiKey,
      url,
      instructions: instructions || undefined,
      max_depth: maxDepth,
      max_breadth: maxBreadth,
      limit,
      select_paths: parseRegexPatterns(selectPaths),
      select_domains: parseRegexPatterns(selectDomains),
      exclude_paths: parseRegexPatterns(excludePaths),
      exclude_domains: parseRegexPatterns(excludeDomains),
      allow_external: allowExternal,
      timeout
    };

    // 5. 发送请求
    const response = await client.post<MapResponse>('/map', requestBody);

    console.log(response.data);

    // 6. 格式化输出
    return {
      baseUrl: response.data.base_url,
      results: response.data.results || [],
      urlCount: (response.data.results || []).length,
      responseTime: response.data.response_time
    };
  } catch (error) {
    return Promise.reject(handleTavilyError(error));
  }
}
