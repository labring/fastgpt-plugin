import { z } from 'zod';
import { createKnowsClient } from '../../../shared/api';
import { getKnowsConfig, validateConfig } from '../../../shared/config';
import {
  createSuccessOutput,
  createErrorOutput,
  formatEvidence,
  formatDate,
  isValidEvidenceId,
  isEmpty
} from '../../../shared/utils';
import type {
  EvidenceType,
  EvidenceDetailRequest,
  PaperEnResponse,
  PaperCnResponse,
  GuideResponse,
  MeetingResponse
} from '../../../shared/types';

/**
 * KnowS 文献详情工具实现
 */

// 输入类型定义
export const InputType = z.object({
  evidenceId: z.string().describe('证据ID'),
  evidenceType: z.enum(['PAPER', 'PAPER_CN', 'GUIDE', 'MEETING']).describe('证据类型'),
  translateToChinese: z.boolean().optional().default(false).describe('是否翻译为中文'),
  apiKey: z.string().describe('API密钥'),
  environment: z.enum(['production', 'development']).optional().describe('环境配置')
});

// 输出类型定义
export const OutputType = z.object({
  success: z.boolean().describe('执行状态'),
  evidenceType: z.string().describe('证据类型'),
  details: z
    .object({
      titleEn: z.string().optional(),
      titleCn: z.string().optional(),
      publishDate: z.string().optional(),
      impactFactor: z.number().optional(),
      studyType: z.string().optional(),
      journal: z.string().optional(),
      authors: z.array(z.string()).optional(),
      doi: z.string().optional(),
      abstractEn: z.string().optional(),
      abstractCn: z.string().optional(),
      casJournalDivision: z.string().optional(),
      casJournalDivisionSub: z.string().optional(),
      wosJifQuartile: z.string().optional(),
      hasPdf: z.boolean().optional(),
      organizations: z.array(z.string()).optional(),
      conference: z.string().optional(),
      sponsor: z.string().optional(),
      dataSource: z.string().optional()
    })
    .describe('文献详情'),
  message: z.string().describe('结果消息'),
  error: z.string().optional().describe('错误信息')
});

export type InputType = z.infer<typeof InputType>;
export type OutputType = z.infer<typeof OutputType>;

/**
 * 格式化英文文献详情
 */
function formatPaperEnDetails(response: PaperEnResponse) {
  return {
    titleEn: response.title_en,
    titleCn: response.title_cn,
    publishDate: response.publish_date,
    impactFactor: response.impact_factor,
    studyType: response.study_type,
    journal: response.journal,
    authors: response.authors,
    doi: response.doi,
    abstractEn: response.abstract_en,
    abstractCn: response.abstract_cn,
    casJournalDivision: response.cas_journal_division,
    casJournalDivisionSub: response.cas_journal_division_sub,
    wosJifQuartile: response.wos_jif_quartile,
    hasPdf: response.has_pdf
  };
}

/**
 * 格式化中文文献详情
 */
function formatPaperCnDetails(response: PaperCnResponse) {
  return {
    titleEn: response.title_en,
    titleCn: response.title_cn,
    publishDate: response.publish_date,
    impactFactor: response.impact_factor,
    studyType: response.study_type,
    journal: response.journal,
    authors: response.authors,
    doi: response.doi,
    abstractEn: response.abstract_en,
    abstractCn: response.abstract_cn
  };
}

/**
 * 格式化指南详情
 */
function formatGuideDetails(response: GuideResponse) {
  return {
    titleEn: response.title_en,
    titleCn: response.title_cn,
    publishDate: response.publish_date,
    organizations: response.organizations
  };
}

/**
 * 格式化会议详情
 */
function formatMeetingDetails(response: MeetingResponse) {
  return {
    titleEn: response.title_en,
    titleCn: response.title_cn,
    publishDate: response.publish_date,
    studyType: response.study_type,
    conference: response.conference,
    sponsor: response.sponsor,
    dataSource: response.data_source,
    authors: response.authors ? [response.authors] : [],
    doi: response.doi,
    abstractEn: response.abstract_en,
    abstractCn: response.abstract_cn
  };
}

/**
 * 获取文献详情工具
 * 根据证据ID和类型获取详细的文献信息
 */
export async function tool(input: InputType): Promise<OutputType> {
  try {
    const {
      evidenceId,
      evidenceType,
      translateToChinese,
      apiKey,
      environment = 'production'
    } = input;

    // 验证输入参数
    if (!evidenceId) {
      return {
        success: false,
        evidenceType,
        details: {},
        message: '',
        error: '证据ID不能为空'
      };
    }

    if (!isValidEvidenceId(evidenceId)) {
      return {
        success: false,
        evidenceType,
        details: {},
        message: '',
        error: '证据ID格式无效'
      };
    }

    // 获取配置
    const config = getKnowsConfig(apiKey, environment);

    // 验证配置
    const configValidation = validateConfig(config);
    if (!configValidation.valid) {
      return {
        success: false,
        evidenceType,
        details: {},
        message: '',
        error: `配置错误: ${configValidation.error}`
      };
    }

    // 创建API客户端
    const client = createKnowsClient(config);

    console.log(`[KnowS Details] 获取${evidenceType}详情: ${evidenceId}`);
    console.log(`[KnowS Details] 翻译选项: ${translateToChinese}`);

    // 构建请求参数
    const request: EvidenceDetailRequest = {
      evidence_id: evidenceId,
      translate_to_chinese: translateToChinese
    };

    let details: any = {};
    let typeLabel = '';

    // 根据证据类型调用不同的API
    switch (evidenceType) {
      case 'PAPER': {
        const response = await client.getPaperEn(request);
        details = formatPaperEnDetails(response);
        typeLabel = '英文文献';
        break;
      }
      case 'PAPER_CN': {
        const response = await client.getPaperCn(request);
        details = formatPaperCnDetails(response);
        typeLabel = '中文文献';
        break;
      }
      case 'GUIDE': {
        const response = await client.getGuide(request);
        details = formatGuideDetails(response);
        typeLabel = '指南文档';
        break;
      }
      case 'MEETING': {
        const response = await client.getMeeting(request);
        details = formatMeetingDetails(response);
        typeLabel = '会议文献';
        break;
      }
      default:
        return {
          success: false,
          evidenceType,
          details: {},
          message: '',
          error: `不支持的证据类型: ${evidenceType}`
        };
    }

    console.log(`[KnowS Details] 获取${typeLabel}详情成功`);

    return {
      success: true,
      evidenceType,
      details,
      message: `成功获取${typeLabel}详情`
    };
  } catch (error) {
    console.error('[KnowS Details] 获取详情失败:', error);

    // 提供更详细的错误信息
    let errorMessage = '获取文献详情失败';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'API调用失败，请检查网络连接或API配置';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'API认证失败，请检查API密钥配置';
      } else if (error.message.includes('404')) {
        errorMessage = '证据不存在或已过期';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'API调用超时，请稍后重试';
      } else {
        errorMessage = `获取详情失败: ${error.message}`;
      }
    }

    return {
      success: false,
      evidenceType: input.evidenceType,
      details: {},
      message: '',
      error: errorMessage
    };
  }
}
