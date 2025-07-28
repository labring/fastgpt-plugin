/**
 * KnowS API 通用类型定义
 * 包含所有 API 接口的请求和响应类型
 */

// 基础配置类型
export interface KnowsConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

// 证据类型枚举
export type EvidenceType = 'PAPER' | 'PAPER_CN' | 'GUIDE' | 'MEETING';

// 答案类型枚举
export type AnswerType = 'CLINICAL' | 'RESEARCH' | 'POPULAR_SCIENCE';

// 标签类型枚举
export type TaggingType =
  | 'THERAPEUTIC_AREA'
  | 'ORGANISM'
  | 'REGION'
  | 'POPULATION_CHARACTERISTICS'
  | 'PARTICIPANT_AGE'
  | 'POPULATION_SEX'
  | 'SAMPLE_SIZE'
  | 'RESEARCH_GROUP'
  | 'TREATMENT_REGIMEN_OF_RESEARCH_GROUP'
  | 'CONTROL_GROUP'
  | 'OUTCOME'
  | 'PRIMARY_OUTCOME'
  | 'LENGTH_OF_FOLLOW_UP'
  | 'MAIN_FINDING'
  | 'EFFECT_SIZE_AND_95CI_FOR_PRIMARY_OUTCOME'
  | 'TRIAL_NUMBER'
  | 'FUNDING_SOURCE'
  | 'LIMITATION'
  | 'STUDY_TYPE'
  | 'ORIGINAL_NON_ORIGINAL_STUDY'
  | 'STUDY_PHASE'
  | 'CLINICAL_STAGE'
  | 'BIOMARKER_STATUS'
  | 'TREATMENT_LINE'
  | 'INCLUSION_EXCLUSION_BASED_ON_POPULATION_CHARACTERISTICS'
  | 'INCLUSION_EXCLUSION_BASED_ON_TREATMENT_LINE'
  | 'INCLUSION_EXCLUSION_BASED_ON_INTERVENTION'
  | 'INCLUSION_EXCLUSION_BASED_ON_OUTCOME'
  | 'RANDOM_SEQUENCE_GENERATION'
  | 'ALLOCATION_CONCEALMENT'
  | 'BLINDING_OF_OUTCOME_ASSESSMENT'
  | 'INCOMPLETE_OUTCOME_DATA'
  | 'BLINDING_OF_PARTICIPANTS_AND_PERSONNEL';

// 块类型枚举
export type BlockType =
  | 'caption'
  | 'footnote'
  | 'equation'
  | 'list-item'
  | 'footer'
  | 'header'
  | 'figure'
  | 'heading'
  | 'table'
  | 'paragraph';

// ===== 检索相关类型 =====

// AI 检索请求
export interface AiSearchRequest {
  query: string;
  data_scope: EvidenceType[];
}

// 证据信息
export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  label: string[];
  has_pdf: boolean;
  summary?: string;
}

// AI 检索响应
export interface AiSearchResponse {
  question_id: string;
  evidences: Evidence[];
}

// ===== 分析相关类型 =====

// 证据总结请求
export interface EvidenceSummaryRequest {
  evidence_id: string;
}

// 证据总结响应
export interface EvidenceSummaryResponse {
  summary: string;
}

// 所有证据总结请求
export interface AllEvidenceSummaryRequest {
  question_id: string;
}

// 流式响应数据
export interface StreamData {
  evidence_id?: string;
  summary?: string;
  content?: string;
  type?: 'END';
}

// 流式响应
export interface StreamResponse {
  created: number;
  data: StreamData;
  id: string;
}

// 高亮块
export interface HighlightBlock {
  block_id?: string;
  block_type: BlockType;
  text: string;
  files: string[];
  page_number: number;
}

// 证据高亮请求
export interface EvidenceHighlightRequest {
  evidence_id: string;
}

// 证据高亮响应
export interface EvidenceHighlightResponse {
  highlights: HighlightBlock[];
}

// ===== 总结相关类型 =====

// 场景总结请求
export interface AnswerRequest {
  question_id: string;
  answer_type: AnswerType;
}

// 场景总结响应
export interface AnswerResponse {
  content: string;
}

// ===== 详情相关类型 =====

// 文献详情请求基类
export interface EvidenceDetailRequest {
  evidence_id: string;
  translate_to_chinese?: boolean;
}

// 英文文献详情响应
export interface PaperEnResponse {
  title_en: string;
  title_cn: string;
  publish_date: string;
  impact_factor: number;
  study_type: string;
  journal: string;
  authors: string[];
  doi: string;
  abstract_en: string;
  abstract_cn: string;
  cas_journal_division: string;
  cas_journal_division_sub: string;
  wos_jif_quartile: string;
  has_pdf: boolean;
}

// 中文文献详情响应
export interface PaperCnResponse {
  title_en: string;
  title_cn: string;
  publish_date: string;
  impact_factor: number;
  study_type: string;
  journal: string;
  authors: string[];
  doi: string;
  abstract_en: string;
  abstract_cn: string;
}

// 指南详情响应
export interface GuideResponse {
  title_en: string;
  title_cn: string;
  publish_date: string;
  organizations: string[];
}

// 会议详情响应
export interface MeetingResponse {
  title_en: string;
  title_cn: string;
  publish_date: string;
  study_type: string;
  conference: string;
  sponsor: string;
  data_source: string;
  authors: string;
  doi: string;
  abstract_en: string;
  abstract_cn: string;
}

// ===== 历史记录相关类型 =====

// 问题列表请求
export interface ListQuestionRequest {
  from_time?: number;
  to_time?: number;
  page?: number;
  page_size?: number;
}

// 问题项
export interface QuestionItem {
  id: string;
  question: string;
  user_id: string;
  time: string;
  clinical_answer: boolean;
  research_answer: boolean;
  popular_science_answer: boolean;
}

// 问题列表响应
export interface ListQuestionResponse {
  total_count: number;
  total_page: number;
  items: QuestionItem[];
}

// 文献解读列表请求
export interface ListInterpretationRequest {
  from_time?: number;
  to_time?: number;
  page?: number;
  page_size?: number;
}

// 解读项
export interface InterpretationItem {
  id: string;
  user_id: string;
  evidence_type: EvidenceType;
  evidence_title: string;
  time: string;
}

// 文献解读列表响应
export interface ListInterpretationResponse {
  total_count: number;
  total_page: number;
  items: InterpretationItem[];
}

// ===== 内容管理相关类型 =====

// PDF 上传请求
export interface CreateEvidenceRequest {
  pdf_file: Buffer | Uint8Array;
}

// PDF 上传响应
export interface CreateEvidenceResponse {
  evidence_id: string;
}

// 自动标签请求
export interface AutoTaggingRequest {
  content?: string;
  evidence_id?: string;
  tagging_type: TaggingType;
}

// 自动标签响应
export interface AutoTaggingResponse {
  result: string;
  extract_result?: string;
  judgment_result?: string;
  judgment_reason?: string;
  reason?: string;
}

// ===== API 响应包装类型 =====

// 标准 API 响应
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 错误响应
export interface ErrorResponse {
  code: number;
  msg: string;
  error?: string;
}

// ===== 工具输入输出类型 =====

// 通用工具输入
export interface ToolInput {
  [key: string]: any;
}

// 通用工具输出
export interface ToolOutput {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
