import { z } from 'zod';
import { createKnowsClient } from '../../../shared/api';
import { getKnowsConfig } from '../../../shared/config';
import type { AiSearchRequest } from '../../../shared/types';

// 定义输入和输出的 Zod schema
export const InputType = z.object({
  query: z.string().describe('检索查询'),
  dataScope: z.array(z.enum(['PAPER', 'PAPER_CN', 'GUIDE', 'MEETING']))
    .default(['PAPER', 'PAPER_CN', 'GUIDE', 'MEETING'])  // 默认包含所有数据范围
    .describe('数据范围'),
  apiKey: z.string().optional().describe('API密钥'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

export const OutputType = z.object({
  success: z.boolean().describe('执行状态'),
  questionId: z.string().describe('问题ID'),
  evidences: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    typeLabel: z.string(),
    labels: z.array(z.string()),
    hasPdf: z.boolean(),
    summary: z.string().optional()
  })).describe('证据列表'),
  evidenceCount: z.number().describe('证据数量'),
  summary: z.string().describe('检索摘要'),
  message: z.string().describe('结果消息')
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

/**
 * 医学文献检索工具
 * 在KnowS数据库中检索相关医学文献和证据
 */
export async function tool(input: InputType): Promise<OutputType> {
  try {
    const { query, dataScope, apiKey, environment = 'production' } = input;

    // 获取配置
    const config = getKnowsConfig(apiKey, environment);
    
    // 创建API客户端
    const client = createKnowsClient(config);

    // 构建API请求
    const request: AiSearchRequest = {
      query: query,
      data_scope: dataScope,
    };

    console.log(`[KnowS Search] 发起检索请求: ${query.substring(0, 50)}...`);
    console.log(`[KnowS Search] 数据范围: ${dataScope.join(', ')}`);
    console.log(`[KnowS Search] API环境: ${environment}`);

    // 调用真实API
    const response = await client.aiSearch(request);

    // 转换API响应为工具输出格式
    const evidences = response.evidences.map(evidence => ({
      id: evidence.id,
      title: evidence.title,
      type: evidence.type,
      typeLabel: getTypeLabel(evidence.type),
      labels: evidence.label || [],
      hasPdf: evidence.has_pdf || false,
      summary: evidence.summary
    }));

    const evidenceCount = evidences.length;
    const typeLabels = [...new Set(evidences.map(e => e.typeLabel))];
    const pdfCount = evidences.filter(e => e.hasPdf).length;
    
    const summary = evidenceCount > 0 
      ? `检索到 ${evidenceCount} 篇相关文献，包括：${typeLabels.join('、')}。其中 ${pdfCount} 篇提供全文PDF。`
      : '未找到相关文献';

    console.log(`[KnowS Search] 检索成功: ${evidenceCount} 篇文献`);

    return {
      success: true,
      questionId: response.question_id,
      evidences,
      evidenceCount,
      summary,
      message: `成功检索到 ${evidenceCount} 篇相关文献`
    };

  } catch (error) {
    console.error('[KnowS Search] 检索失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '检索失败';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接或API服务状态';
      } else if (error.message.includes('API Error')) {
        errorMessage = `API调用失败: ${error.message}`;
      } else if (error.message.includes('Business Error')) {
        errorMessage = `业务错误: ${error.message}`;
      } else {
        errorMessage = `检索失败: ${error.message}`;
      }
    }

    return {
      success: false,
      questionId: '',
      evidences: [],
      evidenceCount: 0,
      summary: '',
      message: errorMessage
    };
  }
}

/**
 * 获取类型标签
 */
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'PAPER': '英文文献',
    'PAPER_CN': '中文文献',
    'GUIDE': '指南文档',
    'MEETING': '会议文献'
  };
  return typeMap[type] || type;
}