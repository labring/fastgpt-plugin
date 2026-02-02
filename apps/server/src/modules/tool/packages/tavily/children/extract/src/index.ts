import { z } from 'zod';
import { createTavilyClient, handleTavilyError, validateApiKey } from '../../../client';
import type { ExtractRequest, ExtractResponse } from '../../../types';

// 输入类型 (包含父级密钥)
export const InputType = z.object({
  tavilyApiKey: z.string().min(1, 'Tavily API key is required'),
  urls: z.string().min(1, 'At least one URL is required'),
  format: z.enum(['markdown', 'text']).default('markdown'),
  extract_depth: z.enum(['basic', 'advanced']).default('basic'),
  include_images: z.boolean().default(false),
  include_favicon: z.boolean().default(false),
  timeout: z.number().min(1).max(60).optional()
});

// 输出类型
export const OutputType = z.object({
  results: z
    .array(
      z.object({
        url: z.string(),
        raw_content: z.string(),
        images: z.array(z.string()).optional(),
        favicon: z.string().optional()
      })
    )
    .default([]),
  successCount: z.number(),
  failedUrls: z.array(z.string()).default([])
});

export async function tool({
  tavilyApiKey,
  urls,
  format,
  extract_depth,
  include_images,
  include_favicon,
  timeout
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 1. 验证 API Key
    validateApiKey(tavilyApiKey);

    // 2. 解析 URLs (支持换行分隔)
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      throw new Error('No valid URLs provided');
    }

    // 3. 创建客户端
    const client = createTavilyClient(tavilyApiKey);

    // 4. 构建请求
    const requestBody: ExtractRequest = {
      api_key: tavilyApiKey,
      urls: urlList.length === 1 ? urlList[0] : urlList,
      format,
      extract_depth,
      include_images,
      include_favicon,
      timeout: timeout || undefined
    };

    // 5. 发送请求
    const response = await client.post<ExtractResponse>('/extract', requestBody);

    console.log(response.data);

    // 6. 格式化输出
    const failedUrls = (response.data.failed_results || []).map(
      (item) => `${item.url}: ${item.error}`
    );

    return {
      results: response.data.results || [],
      successCount: (response.data.results || []).length,
      failedUrls
    };
  } catch (error) {
    return Promise.reject(handleTavilyError(error));
  }
}
