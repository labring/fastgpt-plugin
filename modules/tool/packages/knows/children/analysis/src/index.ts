import { z } from 'zod';
import { createKnowsClient } from '../../../shared/api';
import { getKnowsConfig, validateConfig } from '../../../shared/config';
import {
  createSuccessOutput,
  createErrorOutput,
  formatEvidence,
  formatDate,
  isValidQuestionId,
  isValidEvidenceId,
  isEmpty,
  parseStreamResponse
} from '../../../shared/utils';
import type {
  AnalysisToolInput,
  AnalysisToolOutput,
  FormattedHighlight,
  StreamSummaryResult
} from './types';
import { BLOCK_TYPE_LABELS } from './types';

/**
 * KnowS 证据分析工具实现
 */

// 输入类型定义
export const InputType = z.object({
  apiKey: z.string().describe('KnowS API密钥'),
  analysisType: z.enum(['single_summary', 'all_summary', 'highlight']).describe('分析类型'),
  evidenceId: z.string().optional().describe('证据ID'),
  questionId: z.string().optional().describe('问题ID'),
  streamMode: z.boolean().optional().describe('流式模式'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

// 输出类型定义
export const OutputType = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  analysis_type: z.string().optional(),
  summary: z.string().optional(),
  highlights: z
    .array(
      z.object({
        block_type: z.string(),
        block_type_label: z.string(),
        text: z.string(),
        files: z.array(z.string()),
        page_number: z.number(),
        has_files: z.boolean()
      })
    )
    .optional(),
  stream_results: z
    .array(
      z.object({
        evidence_id: z.string(),
        summary: z.string(),
        order: z.number()
      })
    )
    .optional(),
  evidence_count: z.number().optional(),
  error: z.string().optional()
});

/**
 * 格式化高亮内容
 */
function formatHighlight(highlight: any): FormattedHighlight {
  return {
    block_type: highlight.block_type,
    block_type_label: BLOCK_TYPE_LABELS[highlight.block_type] || highlight.block_type,
    text: highlight.text,
    files: highlight.files || [],
    page_number: highlight.page_number,
    has_files: (highlight.files || []).length > 0
  };
}

/**
 * 验证输入参数
 */
function validateInput(input: AnalysisToolInput): { valid: boolean; error?: string } {
  if (isEmpty(input.analysis_type)) {
    return { valid: false, error: '请选择分析类型' };
  }

  const validTypes = ['single_summary', 'all_summary', 'highlight'];
  if (!validTypes.includes(input.analysisType)) {
    return { valid: false, error: '无效的分析类型' };
  }

  // 单篇分析需要证据ID
  if (input.analysisType === 'single_summary' || input.analysisType === 'highlight') {
    if (isEmpty(input.evidenceId)) {
      return { valid: false, error: '单篇分析需要提供证据ID' };
    }
    if (!isValidEvidenceId(input.evidenceId!)) {
      return { valid: false, error: '证据ID格式无效' };
    }
  }

  // 批量分析需要问题ID
  if (input.analysisType === 'all_summary') {
    if (isEmpty(input.questionId)) {
      return { valid: false, error: '批量分析需要提供问题ID' };
    }
    if (!isValidQuestionId(input.questionId!)) {
      return { valid: false, error: '问题ID格式无效' };
    }
  }

  return { valid: true };
}

/**
 * 执行单篇证据总结
 */
async function executeSingleSummary(client: any, evidenceId: string): Promise<{ summary: string }> {
  const response = await client.getEvidenceSummary({
    evidence_id: evidenceId
  });

  return { summary: response.summary };
}

/**
 * 执行所有证据总结
 */
async function executeAllSummary(
  client: any,
  questionId: string,
  streamMode: boolean = false
): Promise<{ stream_results: StreamSummaryResult[]; evidence_count: number }> {
  if (streamMode) {
    // 流式处理
    const response = await client.getAllEvidenceSummaryStream({
      question_id: questionId
    });

    const streamResults: StreamSummaryResult[] = [];
    let order = 1;

    await parseStreamResponse(response, (data) => {
      if (data.data.evidence_id && data.data.summary) {
        streamResults.push({
          evidence_id: data.data.evidence_id,
          summary: data.data.summary,
          order: order++
        });
      }
    });

    return {
      stream_results: streamResults,
      evidence_count: streamResults.length
    };
  } else {
    // 非流式处理 - 这里需要根据实际API调整
    // 由于API只提供流式接口，我们仍然使用流式但收集所有结果
    return executeAllSummary(client, questionId, true);
  }
}

/**
 * 执行证据高亮分析
 */
async function executeHighlight(
  client: any,
  evidenceId: string
): Promise<{ highlights: FormattedHighlight[] }> {
  const response = await client.getEvidenceHighlight({
    evidence_id: evidenceId
  });

  const formattedHighlights = response.highlights.map(formatHighlight);

  return { highlights: formattedHighlights };
}

/**
 * 执行证据分析
 */
export async function tool(input: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 验证输入参数
    const validation = validateInput(input);
    if (!validation.valid) {
      return createErrorOutput(validation.error!);
    }

    // 获取配置
    const config = getKnowsConfig(input.apiKey, input.environment || 'production');

    // 验证配置
    const configValidation = validateConfig(config);
    if (!configValidation.valid) {
      return createErrorOutput(`配置错误: ${configValidation.error}`);
    }

    // 创建 API 客户端
    const client = createKnowsClient(config);

    const result: any = {
      analysisType: input.analysisType
    };

    // 根据分析类型执行不同操作
    switch (input.analysisType) {
      case 'single_summary': {
        const summaryResult = await executeSingleSummary(client, input.evidenceId!);
        result.summary = summaryResult.summary;
        result.evidence_count = 1;
        break;
      }

      case 'all_summary': {
        const allSummaryResult = await executeAllSummary(
          client,
          input.questionId!,
          input.streamMode
        );
        result.stream_results = allSummaryResult.stream_results;
        result.evidence_count = allSummaryResult.evidence_count;

        // 生成总体摘要
        if (allSummaryResult.stream_results.length > 0) {
          result.summary = `已完成 ${allSummaryResult.evidence_count} 篇证据的AI总结分析`;
        }
        break;
      }

      case 'highlight': {
        const highlightResult = await executeHighlight(client, input.evidenceId!);
        result.highlights = highlightResult.highlights;
        result.evidence_count = 1;

        // 生成高亮摘要
        const blockTypeCounts = highlightResult.highlights.reduce(
          (acc, h) => {
            acc[h.block_type_label] = (acc[h.block_type_label] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const typeTexts = Object.entries(blockTypeCounts)
          .map(([type, count]) => `${type}${count}个`)
          .join('、');

        result.summary = `提取了 ${highlightResult.highlights.length} 个被引用片段，包括：${typeTexts}`;
        break;
      }

      default:
        return createErrorOutput('不支持的分析类型');
    }

    const message = `${
      input.analysisType === 'single_summary'
        ? '单篇证据'
        : input.analysisType === 'all_summary'
          ? '批量证据'
          : '证据高亮'
    }分析完成`;

    return createSuccessOutput(result, message);
  } catch (error) {
    console.error('KnowS 分析工具执行失败:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // 处理常见错误
    if (errorMessage.includes('invalid credential')) {
      return createErrorOutput('API 密钥无效，请检查您的 KnowS API Key');
    }

    if (errorMessage.includes('evidence not found')) {
      return createErrorOutput('证据不存在，请检查证据ID是否正确');
    }

    if (errorMessage.includes('question not found')) {
      return createErrorOutput('问题不存在，请检查问题ID是否正确');
    }

    if (errorMessage.includes('timeout')) {
      return createErrorOutput('请求超时，请稍后重试');
    }

    return createErrorOutput(`分析失败: ${errorMessage}`);
  }
}
