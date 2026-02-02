import { GET } from '@tool/utils/request';
import { z } from 'zod';

// 输入参数类型定义
export const InputType = z.object({
  query: z.string().min(1, '搜索查询词不能为空').describe('搜索查询词'),
  apiKey: z.string().min(1, 'API密钥不能为空').describe('Jina AI API密钥'),
  country: z.string().optional().describe('搜索地区代码（如CN、US等）'),
  language: z.string().optional().describe('搜索语言代码（如zh-cn、en等）'),
  timeout: z.number().min(5).max(120).optional().describe('请求超时时间（秒）'),
  readFullContent: z.boolean().optional().describe('是否读取SERP的完整内容')
});

// 输出结果类型定义
export const OutputType = z
  .object({
    result: z.array(
      z.object({
        title: z.string().describe('搜索结果标题'),
        description: z.string().describe('搜索结果描述'),
        url: z.string().describe('搜索结果URL'),
        content: z.string().optional().describe('搜索结果内容')
      })
    )
  })
  .describe('Jina AI 搜索响应数据');

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
 * Jina AI 搜索工具主函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { query, apiKey, country, language, timeout = 30, readFullContent = false } = props;

  // 清理查询词
  const cleanQuery = query.trim();
  if (cleanQuery.length === 0) {
    return Promise.reject('搜索查询词不能为空或仅包含空白字符');
  }

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

  // 执行搜索
  const {
    data: { data }
  } = await GET<{
    code: number;
    data: {
      title: string;
      url: string;
      description: string;
      content?: string;
    }[];
  }>(searchUrl, {
    headers
  });

  return {
    result: data.map((item) => ({
      title: item.title,
      description: item.description,
      url: item.url,
      content: item.content
    }))
  };
}
