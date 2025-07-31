import { z } from 'zod';
import { createMetasoClient } from '../../../src/api';

// URL 验证正则表达式
const URL_REGEX =
  /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/;

// 输入参数验证模式
export const InputType = z.object({
  apiKey: z.string().min(1, 'API密钥不能为空'),
  url: z
    .string()
    .min(1, 'URL不能为空')
    .regex(URL_REGEX, 'URL格式无效，必须是有效的HTTP或HTTPS地址'),
  includeMetadata: z.boolean().optional().default(true)
});

// 输出类型验证模式
export const OutputType = z.object({
  result: z.string()
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

// 格式化网页读取结果为字符串
function formatReaderResultsToString(response: any, includeMetadata: boolean): string {
  let result = '';

  if (includeMetadata) {
    if (response.title) {
      result += `标题: ${response.title}\n\n`;
    }
    result += `URL: ${response.url}\n\n`;
  }

  result += `内容:\n${response.content}`;

  // 如果包含元数据，添加内容长度信息
  if (includeMetadata) {
    const contentLength = response.content ? response.content.length : 0;
    result += `\n\n内容长度: ${contentLength} 字符`;
  }

  return result.trim();
}

export async function tool(input: InputType): Promise<OutputType> {
  try {
    // 验证输入参数
    const validatedInput = InputType.parse(input);

    // 创建 Metaso API 客户端
    const client = createMetasoClient({
      apiKey: validatedInput.apiKey,
      baseUrl: 'https://metaso.cn'
    });

    // 调用网页读取 API
    const response = await client.reader({
      url: validatedInput.url
    });

    // 格式化结果
    const formattedResult = formatReaderResultsToString(response, validatedInput.includeMetadata);

    return {
      result: formattedResult
    };
  } catch (error) {
    console.error('Metaso Reader 工具执行失败:', error);

    // 特殊处理 URL 格式错误
    if (error instanceof z.ZodError) {
      const urlError = error.errors.find((err) => err.path.includes('url'));
      if (urlError) {
        return {
          result: `URL格式错误: ${urlError.message}`
        };
      }
    }

    return {
      result: `网页读取失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
