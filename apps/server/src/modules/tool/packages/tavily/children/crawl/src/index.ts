import { z } from 'zod';
import { createTavilyClient, handleTavilyError, validateApiKey } from '../../../client';
import type { CrawlRequest, CrawlResponse } from '../../../types';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  tavilyApiKey: z.string().min(1, 'Tavily API key is required'),
  url: z.string().min(1, 'URL is required'),
  instructions: z.string().optional(),
  maxDepth: z.number().int().min(1).max(5).default(1),
  maxBreadth: z.number().int().min(1).default(20),
  limit: z.number().int().min(1).default(50),
  selectPaths: z.string().optional(),
  excludePaths: z.string().optional(),
  allowExternal: z.boolean().default(true),
  includeImages: z.boolean().default(false),
  extractDepth: z.enum(['basic', 'advanced']).default('basic'),
  format: z.enum(['markdown', 'text']).default('markdown'),
  includeFavicon: z.boolean().default(false),
  timeout: z.number().min(10).max(150).default(150)
});

// 输出类型
export const OutputType = z.object({
  baseUrl: z.string(),
  results: z
    .array(
      z.object({
        url: z.string(),
        raw_content: z.string(),
        favicon: z.string().optional()
      })
    )
    .default([]),
  successCount: z.number(),
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
  excludePaths,
  allowExternal,
  includeImages,
  extractDepth,
  format,
  includeFavicon,
  timeout
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 1. 验证 API Key
    validateApiKey(tavilyApiKey);

    // 2. 创建客户端
    const client = createTavilyClient(tavilyApiKey);

    // 3. 处理数组类型的参数
    let parsedSelectPaths: string[] | undefined;
    let parsedExcludePaths: string[] | undefined;

    if (selectPaths) {
      parsedSelectPaths = selectPaths
        .split('\n')
        .map((path) => path.trim())
        .filter((path) => path.length > 0);
    }

    if (excludePaths) {
      parsedExcludePaths = excludePaths
        .split('\n')
        .map((path) => path.trim())
        .filter((path) => path.length > 0);
    }

    // 4. 构建请求
    const requestBody: CrawlRequest = {
      api_key: tavilyApiKey,
      url,
      instructions: instructions || undefined,
      max_depth: maxDepth,
      max_breadth: maxBreadth,
      limit,
      select_paths: parsedSelectPaths,
      select_domains: undefined,
      exclude_paths: parsedExcludePaths,
      exclude_domains: undefined,
      allow_external: allowExternal,
      include_images: includeImages,
      extract_depth: extractDepth,
      format,
      include_favicon: includeFavicon,
      timeout
    };

    // 5. 发送请求
    const response = await client.post<CrawlResponse>('/crawl', requestBody);

    console.log(response.data);

    // 6. 格式化输出
    return {
      baseUrl: response.data.base_url,
      results: response.data.results || [],
      successCount: (response.data.results || []).length,
      responseTime: response.data.response_time
    };
  } catch (error) {
    return Promise.reject(handleTavilyError(error));
  }
}
