import { z } from 'zod';

// ============================================
// FastGPT 枚举定义
// ============================================

// Flow Node Input Type - 流程节点输入类型
export const FlowNodeInputTypeEnum = z.enum([
  'reference',
  'input',
  'textarea',
  'numberInput',
  'switch',
  'select',
  'multipleSelect',
  'JSONEditor',
  'addInputParam',
  'selectApp',
  'customVariable',
  'selectLLMModel',
  'settingLLMModel',
  'selectDataset',
  'selectDatasetParamsModal',
  'settingDatasetQuotePrompt',
  'hidden',
  'custom',
  'fileSelect'
]);
export type FlowNodeInputTypeEnum = z.infer<typeof FlowNodeInputTypeEnum>;

// Workflow IO Value Type - 工作流输入输出值类型
export const WorkflowIOValueTypeEnum = z.enum([
  'string',
  'number',
  'boolean',
  'object',
  'arrayString',
  'arrayNumber',
  'arrayBoolean',
  'arrayObject',
  'arrayAny',
  'any',
  'chatHistory',
  'datasetQuote',
  'dynamic',
  'selectDataset',
  'selectApp'
]);
export type WorkflowIOValueTypeEnum = z.infer<typeof WorkflowIOValueTypeEnum>;

// LLM Model Type - LLM 模型类型
export const LLMModelTypeEnum = z.enum(['all', 'classify', 'extractFields', 'toolCall']);
export type LLMModelTypeEnum = z.infer<typeof LLMModelTypeEnum>;

// Flow Node Output Type - 流程节点输出类型
export const FlowNodeOutputTypeEnum = z.enum(['hidden', 'source', 'static', 'dynamic', 'error']);
export type FlowNodeOutputTypeEnum = z.infer<typeof FlowNodeOutputTypeEnum>;
