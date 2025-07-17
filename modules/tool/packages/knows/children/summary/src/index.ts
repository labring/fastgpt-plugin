import { z } from 'zod';
import type { AnswerRequest, AnswerType } from '../../../shared/types';
import { createKnowsClient } from '../../../shared/api';
import { getKnowsConfig } from '../../../shared/config';

// 输入类型定义 - 支持兼容性处理
export const InputType = z.object({
  apiKey: z.string().describe('KnowS API密钥'),
  questionId: z.string().describe('问题ID，用于获取检索结果'),
  answerType: z
    .union([
      z.enum(['CLINICAL', 'RESEARCH', 'POPULAR_SCIENCE']),
      z.array(z.enum(['CLINICAL', 'RESEARCH', 'POPULAR_SCIENCE']))
    ])
    .default('CLINICAL')
    .describe('总结类型：CLINICAL-临床应用，RESEARCH-研究发现，POPULAR_SCIENCE-科普解读'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

// 输出类型定义
export const OutputType = z.object({
  success: z.boolean().describe('是否成功'),
  content: z.string().describe('总结内容'),
  message: z.string().optional().describe('提示信息'),
  error: z.string().optional().describe('错误信息')
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

export async function tool(input: InputType): Promise<OutputType> {
  try {
    console.log('[KnowS Summary] 工具开始执行');
    console.log('[KnowS Summary] 原始输入:', JSON.stringify(input, null, 2));

    const { apiKey, questionId, answerType, environment = 'production' } = input;

    console.log('[KnowS Summary] 解析后参数:');
    console.log('[KnowS Summary] - questionId:', questionId);
    console.log('[KnowS Summary] - answerType:', answerType);
    console.log('[KnowS Summary] - answerType类型:', typeof answerType);
    console.log('[KnowS Summary] - answerType是否为数组:', Array.isArray(answerType));

    // 验证输入参数
    if (!questionId) {
      console.log('[KnowS Summary] 错误: 问题ID不能为空');
      return {
        success: false,
        content: '',
        error: '问题ID不能为空'
      };
    }

    if (!answerType) {
      console.log('[KnowS Summary] 错误: 请选择总结类型');
      return {
        success: false,
        content: '',
        error: '请选择总结类型'
      };
    }

    // 处理可能的数组输入（兼容性处理）
    let finalAnswerType: AnswerType;
    if (Array.isArray(answerType)) {
      console.log('[KnowS Summary] 检测到数组输入，取第一个值:', answerType[0]);
      finalAnswerType = answerType[0] as AnswerType;
    } else {
      finalAnswerType = answerType as AnswerType;
    }

    console.log('[KnowS Summary] 最终使用的answerType:', finalAnswerType);

    // 获取配置并创建API客户端
    const config = getKnowsConfig(apiKey, environment);
    const client = createKnowsClient(config);

    console.log('[KnowS Summary] 准备调用KnowS API生成总结...');
    console.log('[KnowS Summary] 请求参数:', {
      question_id: questionId,
      answer_type: finalAnswerType
    });

    // 调用真实的KnowS API - 使用单个answerType值
    const request: AnswerRequest = {
      question_id: questionId,
      answer_type: finalAnswerType
    };

    console.log('[KnowS Summary] 发送API请求...');
    const response = await client.getAnswer(request);

    console.log('[KnowS Summary] API响应成功');
    console.log('[KnowS Summary] 响应内容长度:', response.content?.length || 0, '字符');

    // 类型描述映射，用于生成友好的提示信息
    const typeDescriptions: Record<string, string> = {
      CLINICAL: '临床应用',
      RESEARCH: '研究发现',
      POPULAR_SCIENCE: '科普解读'
    };

    const selectedTypeName = typeDescriptions[finalAnswerType];
    console.log('[KnowS Summary] 总结生成成功:', selectedTypeName);

    return {
      success: true,
      content: response.content,
      message: `成功生成${selectedTypeName}总结`
    };
  } catch (error) {
    console.error('[KnowS Summary] 工具执行错误:', error);

    // 增强错误处理，提供更详细的错误信息
    let errorMessage = '生成总结时发生错误';

    if (error instanceof Error) {
      console.error('[KnowS Summary] 错误详情:', error.message);
      errorMessage = error.message;

      // 针对常见错误提供更友好的提示
      if (error.message.includes('fetch')) {
        errorMessage = 'API调用失败，请检查网络连接或API配置';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'API认证失败，请检查API密钥配置';
      } else if (error.message.includes('404')) {
        errorMessage = '问题ID不存在或已过期';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'API调用超时，请稍后重试';
      }
    }

    return {
      success: false,
      content: '',
      error: errorMessage
    };
  }
}
