import type { Evidence, ToolInput, ToolOutput } from '../../../shared/types';

/**
 * 详情工具相关类型定义
 */

// 详情类型
export type DetailType = 'paper_en' | 'paper_cn' | 'guide' | 'meeting';

// 详情工具输入
export interface DetailsToolInput extends ToolInput {
  evidence_id: string;
  detail_type: DetailType;
  translate_to_chinese?: boolean;
  include_abstract?: boolean;
  api_key?: string;
  environment?: 'production' | 'development';
}

// 详情工具输出
export interface DetailsToolOutput extends ToolOutput {
  detail_type?: DetailType;
  evidence_id?: string;
  title?: string;
  title_cn?: string;
  authors?: string[];
  journal?: string;
  publish_date?: string;
  doi?: string;
  abstract?: string;
  abstract_cn?: string;
  impact_factor?: number;
  study_type?: string;
  has_pdf?: boolean;
  quartile?: string;
  cas_division?: string;
  organization?: string;
  location?: string;
}

// 英文文献详情
export interface PaperEnDetails {
  title_en: string;
  title_cn?: string;
  authors: string[];
  journal: string;
  publish_date: string;
  doi?: string;
  abstract_en?: string;
  abstract_cn?: string;
  impact_factor?: number;
  study_type?: string;
  has_pdf: boolean;
  wos_jif_quartile?: string;
  cas_journal_division?: string;
}

// 中文文献详情
export interface PaperCnDetails {
  title_cn: string;
  authors: string[];
  journal: string;
  publish_date: string;
  doi?: string;
  abstract_cn?: string;
  study_type?: string;
  has_pdf: boolean;
}

// 指南详情
export interface GuideDetails {
  title: string;
  organization: string;
  publish_date: string;
  abstract?: string;
  has_pdf: boolean;
}

// 会议详情
export interface MeetingDetails {
  title: string;
  organization: string;
  location: string;
  publish_date: string;
  abstract?: string;
  has_pdf: boolean;
}

// 详情类型标签映射
export const DETAIL_TYPE_LABELS: Record<DetailType, string> = {
  paper_en: '英文文献',
  paper_cn: '中文文献',
  guide: '指南',
  meeting: '会议',
};

// 研究类型标签映射
export const STUDY_TYPE_LABELS: Record<string, string> = {
  'RCT': '随机对照试验',
  'META_ANALYSIS': 'Meta分析',
  'SYSTEMATIC_REVIEW': '系统评价',
  'COHORT_STUDY': '队列研究',
  'CASE_CONTROL': '病例对照研究',
  'CROSS_SECTIONAL': '横断面研究',
  'CASE_REPORT': '病例报告',
  'REVIEW': '综述',
  'GUIDELINE': '指南',
  'EXPERT_CONSENSUS': '专家共识',
};