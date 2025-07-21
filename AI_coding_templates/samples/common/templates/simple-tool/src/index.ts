import { z } from 'zod';

// 输入类型定义
export const InputType = z.object({
  input: z.string().min(1, '输入内容不能为空'),
  options: z.string().optional().default('')
});

// 输出类型定义
export const OutputType = z.object({
  result: z.string(),
  metadata: z.object({
    processedAt: z.string(),
    inputLength: z.number(),
    processingTime: z.number()
  })
});

/**
 * 简单工具核心处理函数
 * 这是一个模板函数，请根据实际需求修改实现逻辑
 * 
 * @param props 输入参数
 * @returns 处理结果
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const startTime = Date.now();
  
  try {
    const { input, options } = props;
    
    // 输入验证 - 确保输入数据的有效性
    if (!input || input.trim().length === 0) {
      throw new Error('输入内容不能为空');
    }
    
    // 核心处理逻辑 - 请根据实际需求修改
    // 这里是一个简单的示例：将输入转换为大写并添加前缀
    let result = input.trim().toUpperCase();
    
    // 根据选项进行额外处理
    if (options) {
      switch (options.toLowerCase()) {
        case 'reverse':
          result = result.split('').reverse().join('');
          break;
        case 'prefix':
          result = `[PROCESSED] ${result}`;
          break;
        case 'suffix':
          result = `${result} [DONE]`;
          break;
        default:
          // 保持原样
          break;
      }
    }
    
    const endTime = Date.now();
    
    // 返回处理结果和元数据
    return {
      result,
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: input.length,
        processingTime: endTime - startTime
      }
    };
    
  } catch (error) {
    // 错误处理 - 提供清晰的错误信息
    const errorMessage = error instanceof Error ? error.message : '处理过程中发生未知错误';
    
    throw new Error(`简单工具处理失败: ${errorMessage}`);
  }
}

/**
 * 工具验证函数
 * 用于验证工具的基本功能是否正常
 */
export async function validateTool(): Promise<boolean> {
  try {
    const testInput = { input: 'test', options: 'prefix' };
    const result = await tool(testInput);
    
    return result.result.includes('TEST') && result.metadata.inputLength === 4;
  } catch {
    return false;
  }
}