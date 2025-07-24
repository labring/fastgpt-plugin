import { z } from 'zod';
import { createMetasoClient } from '../../../src/api';
import type { SearchScope } from '../../../src/types';

// 输入参数类型定义
export const InputType = z.object({
  query: z.string().min(1, '搜索查询词不能为空').describe('搜索查询词'),
  apiKey: z.string().min(1, 'API密钥不能为空').describe('Metaso API密钥'),
  scope: z.string().optional().describe('搜索范围类型（all、webpage、academic、news）'),
  includeSummary: z.boolean().optional().describe('是否包含搜索结果摘要'),
  size: z.number().min(1).max(20).optional().describe('返回的搜索结果数量（1-20）')
});

// 输出结果类型定义
export const OutputType = z
  .object({
    result: z.string().describe('格式化的搜索结果，包含标题、链接、描述和可选摘要')
  })
  .describe('Metaso 搜索响应数据');

/**
 * 格式化搜索结果为字符串
 */
function formatSearchResultsToString(response: any): string {
  if (!response || !response.results || !Array.isArray(response.results)) {
    return '未找到搜索结果';
  }

  const { query, results, total, scope } = response;
  let output = `搜索查询: ${query}\n`;
  output += `搜索范围: ${scope}\n`;
  output += `结果数量: ${results.length}${total ? ` / ${total}` : ''}\n\n`;

  results.forEach((item: any, index: number) => {
    output += `${index + 1}. ${item.title}\n`;
    output += `   链接: ${item.url}\n`;
    output += `   摘要: ${item.snippet}\n`;

    if (item.summary) {
      output += `   AI摘要: ${item.summary}\n`;
    }

    if (item.publishTime) {
      output += `   发布时间: ${item.publishTime}\n`;
    }

    if (item.source) {
      output += `   来源: ${item.source}\n`;
    }

    output += '\n';
  });

  return output.trim();
}

/**
 * Metaso 搜索工具主函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { query, apiKey, scope = 'all', includeSummary = true, size = 10 } = props;

  // 清理查询词
  const cleanQuery = query.trim();
  if (cleanQuery.length === 0) {
    return Promise.reject('搜索查询词不能为空或仅包含空白字符');
  }

  // 验证搜索范围并映射到 API 支持的值
  const scopeMapping: Record<string, SearchScope> = {
    all: 'all',
    web: 'webpage',
    webpage: 'webpage',
    academic: 'academic',
    news: 'news'
  };

  const mappedScope = scopeMapping[scope] || 'webpage';

  // 创建 Metaso API 客户端
  const client = createMetasoClient({
    apiKey,
    baseUrl: 'https://metaso.cn' // 提供默认的 baseUrl
  });

  try {
    // 调用搜索 API
    const response = await client.search({
      q: cleanQuery,
      scope: mappedScope,
      size: size.toString(), // API 期望字符串类型
      includeSummary
    });

    // 格式化搜索结果为字符串
    const formattedResult = formatSearchResultsToString(response);

    return {
      result: formattedResult
    };
  } catch (error: any) {
    // 错误处理
    const errorMessage = error?.message || '搜索请求失败';
    console.error('Metaso 搜索错误:', error);
    return Promise.reject(`搜索失败: ${errorMessage}`);
  }
}
