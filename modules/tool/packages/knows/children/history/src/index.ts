import { z } from 'zod';
import { getKnowsConfig } from '../../../shared/config';
import { createKnowsClient } from '../../../shared/api';

// 定义输入和输出的 Zod schema
export const InputType = z.object({
  historyType: z.enum(['question', 'interpretation']).describe('历史记录类型：question-问题历史，interpretation-文献解读历史'),
  fromTime: z.number().optional().describe('起始时间戳（毫秒）'),
  toTime: z.number().optional().describe('结束时间戳（毫秒）'),
  page: z.number().default(1).describe('页码，从1开始'),
  pageSize: z.number().default(20).describe('每页条数，最大50'),
  apiKey: z.string().optional().describe('API密钥'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

export const OutputType = z.object({
  success: z.boolean().describe('执行状态'),
  historyType: z.string().describe('历史记录类型'),
  records: z.array(z.object({
    id: z.string().describe('记录ID'),
    title: z.string().describe('标题或问题内容'),
    time: z.string().describe('时间'),
    userId: z.string().describe('用户ID'),
    type: z.string().optional().describe('记录类型'),
    hasAnswers: z.object({
      clinical: z.boolean().optional(),
      research: z.boolean().optional(),
      popularScience: z.boolean().optional()
    }).optional().describe('答案类型（仅问题历史）'),
    evidenceType: z.string().optional().describe('证据类型（仅文献解读历史）')
  })).describe('历史记录列表'),
  totalCount: z.number().describe('总记录数'),
  totalPage: z.number().describe('总页数'),
  currentPage: z.number().describe('当前页码'),
  message: z.string().optional().describe('执行消息')
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

/**
 * 验证输入参数
 */
function validateInput(input: InputType): string | null {
  if (input.page < 1) {
    return '页码必须大于等于1';
  }
  
  if (input.pageSize < 1 || input.pageSize > 50) {
    return '每页条数必须在1-50之间';
  }
  
  if (input.fromTime && input.toTime && input.fromTime >= input.toTime) {
    return '起始时间必须小于结束时间';
  }
  
  return null;
}

/**
 * 获取问题历史记录
 */
async function getQuestionHistory(
  client: any,
  fromTime?: number,
  toTime?: number,
  page: number = 1,
  pageSize: number = 20
) {
  const response = await client.listQuestions({
    from_time: fromTime,
    to_time: toTime,
    page,
    page_size: pageSize
  });
  
  return {
    records: response.items.map((item: any) => ({
      id: item.id,
      title: item.question,
      time: item.time,
      userId: item.user_id,
      type: 'question',
      hasAnswers: {
        clinical: item.clinical_answer,
        research: item.research_answer,
        popularScience: item.popular_science_answer
      }
    })),
    totalCount: response.total_count,
    totalPage: response.total_page
  };
}

/**
 * 获取文献解读历史记录
 */
async function getInterpretationHistory(
  client: any,
  fromTime?: number,
  toTime?: number,
  page: number = 1,
  pageSize: number = 20
) {
  const response = await client.listInterpretations({
    from_time: fromTime,
    to_time: toTime,
    page,
    page_size: pageSize
  });
  
  return {
    records: response.items.map((item: any) => ({
      id: item.id,
      title: item.evidence_title,
      time: item.time,
      userId: item.user_id,
      type: 'interpretation',
      evidenceType: item.evidence_type
    })),
    totalCount: response.total_count,
    totalPage: response.total_page
  };
}

/**
 * 历史记录管理工具
 * 管理和查看医学知识检索的历史记录
 */
export async function tool(input: InputType): Promise<OutputType> {
  try {
    // 验证输入参数
    const validationError = validateInput(input);
    if (validationError) {
      return {
        success: false,
        historyType: input.historyType,
        records: [],
        totalCount: 0,
        totalPage: 0,
        currentPage: input.page,
        message: `输入参数错误: ${validationError}`
      };
    }

    // 获取配置
    const config = getKnowsConfig(input.apiKey, input.environment);
    if (!config.apiKey) {
      return {
        success: false,
        historyType: input.historyType,
        records: [],
        totalCount: 0,
        totalPage: 0,
        currentPage: input.page,
        message: 'API密钥未配置，请检查环境变量或传入apiKey参数'
      };
    }

    // 创建API客户端
    const client = createKnowsClient(config);

    let result;
    
    // 根据历史记录类型调用不同的API
    if (input.historyType === 'question') {
      result = await getQuestionHistory(
        client,
        input.fromTime,
        input.toTime,
        input.page,
        input.pageSize
      );
    } else {
      result = await getInterpretationHistory(
        client,
        input.fromTime,
        input.toTime,
        input.page,
        input.pageSize
      );
    }

    return {
      success: true,
      historyType: input.historyType,
      records: result.records,
      totalCount: result.totalCount,
      totalPage: result.totalPage,
      currentPage: input.page,
      message: `成功获取${result.records.length}条${input.historyType === 'question' ? '问题' : '文献解读'}历史记录`
    };

  } catch (error: any) {
    console.error('历史记录获取失败:', error);
    
    // 处理特定错误类型
    let errorMessage = '历史记录获取失败';
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorMessage = 'API密钥无效，请检查配置';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.message?.includes('network')) {
      errorMessage = '网络连接失败，请检查网络设置';
    } else if (error.message) {
      errorMessage = `历史记录获取失败: ${error.message}`;
    }
    
    return {
      success: false,
      historyType: input.historyType,
      records: [],
      totalCount: 0,
      totalPage: 0,
      currentPage: input.page,
      message: errorMessage
    };
  }
}