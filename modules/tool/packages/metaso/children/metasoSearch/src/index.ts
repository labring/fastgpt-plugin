import { z } from 'zod';
import { POST } from '@tool/utils/request';

export const InputType = z.object({
  apiKey: z.string().min(1, 'API key required').describe('Metaso API密钥'),
  query: z
    .string()
    .min(1, 'Search query required')
    .describe('搜索查询词')
    .transform((val) => val.trim()),
  scope: z
    .enum(['all', 'webpage', 'document', 'scholar', 'image', 'video', 'podcast'])
    .optional()
    .default('all'),
  includeSummary: z.boolean().optional().default(true).describe('是否包含搜索结果摘要'),
  size: z.number().min(1).max(20).optional().default(20).describe('返回的搜索结果数量（1-20）')
});

export const OutputType = z
  .object({
    result: z.array(z.any()).min(1, '搜索结果为空或数据格式错误')
  })
  .describe('Metaso 搜索响应数据');

/**
 * Metaso 搜索工具主函数
 */
export async function tool({
  query,
  apiKey,
  scope,
  includeSummary,
  size
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { data } = await POST<{
    webpages?: {
      title: string;
      link: string;
      snippet?: string;
      summary?: string;
      authors: string[];
      date: string;
    }[];
    documents?: {
      title: string;
      link: string;
      summary?: string;
      snippet?: string;
    }[];
    scholars: {
      title: string;
      link: string;
      snippet?: string;
      summary?: string;
      authors: string[];
      date: string;
    }[];
    images: {
      title: string;
      imageUrl: string;
    }[];
    videos: {
      title: string;
      link: string;
      snippet: string;
      authors: string[];
      date: string;
      coverImage: string;
    }[];
    podcasts: {
      title: string;
      link: string;
      snippet: string;
      authors: string[];
      date: string;
    }[];
  }>(
    'https://metaso.cn/api/v1/search',
    {
      q: query,
      scope,
      includeSummary,
      size: String(size)
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  const result = (() => {
    // Add webpages results
    if (data.webpages) {
      return data.webpages.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        summary: item.summary,
        authors: item.authors,
        date: item.date
      }));
    }

    // Add documents results
    if (data.documents) {
      return data.documents.map((item) => ({
        title: item.title,
        link: item.link,
        summary: item.summary,
        snippet: item.snippet
      }));
    }

    // Add scholars results
    if (data.scholars) {
      return data.scholars.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        summary: item.summary,
        authors: item.authors,
        date: item.date
      }));
    }

    // Add images results
    if (data.images) {
      return data.images.map((item) => ({
        title: item.title,
        imageUrl: item.imageUrl
      }));
    }

    // Add videos results
    if (data.videos) {
      return data.videos.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        authors: item.authors,
        date: item.date,
        coverImage: item.coverImage
      }));
    }

    // Add podcasts results
    if (data.podcasts) {
      return data.podcasts.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        authors: item.authors,
        date: item.date
      }));
    }

    throw new Error('No search results found');
  })();

  return {
    result
  };
}
