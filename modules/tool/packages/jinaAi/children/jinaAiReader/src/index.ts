import { z } from 'zod';
import { addLog } from '@/utils/log';
import { GET } from '@tool/utils/request';

// 输入参数类型定义
export const InputType = z.object({
  apiKey: z.string().describe('Jina AI API密钥'),
  url: z.string().url('请提供有效的URL地址').describe('要提取内容的网页URL'),
  returnFormat: z
    .enum(['default', 'markdown', 'html', 'text', 'screenshot', 'pageshot'])
    .optional()
    .describe('内容返回格式，默认default')
});

// 输出结果类型定义
export const OutputType = z
  .object({
    title: z.string().describe('网页标题'),
    description: z.string().describe('网页描述'),
    content: z.string().describe('网页内容')
  })
  .describe('Jina AI Reader API的响应内容');

/**
 * 构建请求头
 */
function buildHeaders(apiKey: string, returnFormat: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'User-Agent': 'FastGPT-JinaAI-Plugin/0.1.0'
  };

  // 根据格式设置X-Return-Format头
  if (returnFormat !== 'default') {
    headers['X-Return-Format'] = returnFormat;
  }

  return headers;
}

/**
 * Jina AI Reader 工具主函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { url, apiKey, returnFormat = 'default' } = props;

  const {
    data: { data }
  } = await GET<{
    code: number;
    data: {
      title: string;
      description: string;
      html?: string;
      text?: string;
      screenshotUrl?: string;
      pageshotUrl?: string;
      content?: string;
    };
  }>(`https://r.jina.ai/${url}`, {
    headers: buildHeaders(apiKey, returnFormat)
  });

  const content = (() => {
    switch (returnFormat) {
      case 'html':
        return data.html || '';
      case 'text':
        return data.text || '';
      case 'screenshot':
        return data.screenshotUrl || '';
      case 'pageshot':
        return data.pageshotUrl || '';
      case 'markdown':
      case 'default':
      default:
        return data.content || '';
    }
  })();

  addLog.info('Jina AI Reader response:', data);

  return {
    title: data.title,
    description: data.description,
    content
  };
}
