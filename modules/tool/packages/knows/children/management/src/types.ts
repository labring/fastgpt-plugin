import type { ToolInput, ToolOutput } from '../../../shared/types';

/**
 * 内容管理工具相关类型定义
 */

// 操作类型
export type ManagementAction = 'create_evidence' | 'auto_tagging';

// 标签类型
export type TagType =
  | 'disease'
  | 'treatment'
  | 'medication'
  | 'study_type'
  | 'population'
  | 'outcome';

// 内容管理工具输入
export interface ManagementToolInput extends ToolInput {
  action: ManagementAction;
  pdf_file?: string;
  file_name?: string;
  evidence_id?: string;
  tag_types?: TagType[];
  auto_extract?: boolean;
  language?: 'zh' | 'en' | 'auto';
  api_key?: string;
  environment?: 'production' | 'development';
}

// 内容管理工具输出
export interface ManagementToolOutput extends ToolOutput {
  action?: ManagementAction;
  evidence_id?: string;
  file_name?: string;
  file_size?: number;
  page_count?: number;
  extracted_info?: ExtractedInfo;
  tags?: Tag[];
  tag_count?: number;
  processing_time?: number;
  language_detected?: string;
  confidence_score?: number;
}

// 提取的信息
export interface ExtractedInfo {
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  doi?: string;
  journal?: string;
  publish_date?: string;
  study_type?: string;
  methodology?: string;
  conclusions?: string;
}

// 标签信息
export interface Tag {
  id: string;
  type: TagType;
  name: string;
  confidence: number;
  category?: string;
  description?: string;
}

// 创建证据响应
export interface CreateEvidenceResponse {
  evidence_id: string;
  file_name: string;
  file_size: number;
  page_count: number;
  processing_status: 'success' | 'processing' | 'failed';
  extracted_info?: ExtractedInfo;
  processing_time: number;
  language_detected: string;
}

// 自动标签响应
export interface AutoTaggingResponse {
  evidence_id: string;
  tags: Tag[];
  tag_count: number;
  processing_time: number;
  confidence_score: number;
}

// 操作类型标签映射
export const ACTION_LABELS: Record<ManagementAction, string> = {
  create_evidence: '创建证据',
  auto_tagging: '自动标签'
};

// 标签类型标签映射
export const TAG_TYPE_LABELS: Record<TagType, string> = {
  disease: '疾病',
  treatment: '治疗方法',
  medication: '药物',
  study_type: '研究类型',
  population: '人群',
  outcome: '结局指标'
};

// 语言标签映射
export const LANGUAGE_LABELS: Record<string, string> = {
  zh: '中文',
  en: '英文',
  auto: '自动检测'
};
