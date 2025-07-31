import { z } from 'zod';
import { type SearchScope } from '../../../src/types';
import { createMetasoClient } from '../../../src/api';

// 输入参数验证模式
export const InputType = z.object({
  apiKey: z.string().min(1, 'API密钥不能为空'),
  question: z.string().min(1, '问题不能为空'),
  scope: z.enum(['all', 'webpage', 'academic', 'news']).optional().default('all'),
  includeReferences: z.boolean().optional().default(true)
});

// 输出类型验证模式
export const OutputType = z.object({
  result: z.string()
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

// 格式化问答结果为字符串
function formatAskResultsToString(response: any): string {
  let result = `问题: ${response.query}\n\n`;
  result += `回答: ${response.answer}\n\n`;

  if (response.sources && response.sources.length > 0) {
    result += '参考资料:\n';
    response.sources.forEach((source: any, index: number) => {
      result += `${index + 1}. ${source.title}\n`;
      result += `   链接: ${source.url}\n`;
      if (source.snippet) {
        result += `   摘要: ${source.snippet}\n`;
      }
      result += '\n';
    });
  }

  return result.trim();
}

export async function tool(input: InputType): Promise<OutputType> {
  try {
    // 验证输入参数
    const validatedInput = InputType.parse(input);

    // 验证搜索范围
    const validScopes: SearchScope[] = ['all', 'webpage', 'academic', 'news'];
    if (!validScopes.includes(validatedInput.scope as SearchScope)) {
      throw new Error(`无效的搜索范围: ${validatedInput.scope}`);
    }

    // 创建 Metaso API 客户端
    const client = createMetasoClient({
      apiKey: validatedInput.apiKey,
      baseUrl: 'https://metaso.cn'
    });

    // 调用问答 API
    const response = await client.ask({
      q: validatedInput.question,
      scope: validatedInput.scope as SearchScope
    });

    // 格式化结果
    const formattedResult = formatAskResultsToString(response);

    return {
      result: formattedResult
    };
  } catch (error) {
    console.error('Metaso Ask 工具执行失败:', error);
    return {
      result: `问答失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
