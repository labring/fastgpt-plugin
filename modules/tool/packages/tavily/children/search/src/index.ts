import { z } from 'zod';
import { createTavilyClient, handleTavilyError, validateApiKey } from '../../../client';
import type { SearchRequest, SearchResponse } from '../../../types';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  tavilyApiKey: z.string().min(1, 'Tavily API key is required'),
  query: z.string().min(1, 'Search query cannot be empty'),
  searchDepth: z.enum(['basic', 'advanced']).default('basic'),
  maxResults: z.number().int().min(1).max(20).default(5),
  includeAnswer: z.boolean().default(false)
});

// 输出类型
export const OutputType = z.object({
  answer: z.string().optional(),
  results: z
    .array(
      z.object({
        title: z.string().nullable(),
        url: z.string().nullable(),
        content: z.string().nullable(),
        raw_content: z.string().optional().nullable()
      })
    )
    .default([])
});

export async function tool({
  tavilyApiKey,
  query,
  searchDepth,
  maxResults,
  includeAnswer
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 1. 验证 API Key
    validateApiKey(tavilyApiKey);

    // 2. 创建客户端
    const client = createTavilyClient(tavilyApiKey);

    // 3. 构建请求
    const requestBody: SearchRequest = {
      api_key: tavilyApiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: includeAnswer
    };

    // 4. 发送请求
    const response = await client.post<SearchResponse>('/search', requestBody);

    console.log(response.data);

    // 5. 格式化输出
    return {
      answer: response.data.answer || '',
      results: response.data.results || []
    };
  } catch (error) {
    return Promise.reject(handleTavilyError(error));
  }
}
