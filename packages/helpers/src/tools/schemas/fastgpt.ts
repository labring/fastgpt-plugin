import z from 'zod';

export const FlowNodeInputTypeSchema = z.enum([
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
export const FlowNodeInputTypeEnum = FlowNodeInputTypeSchema.enum;
// Workflow IO Value Type - 工作流输入输出值类型
export const WorkflowIOValueTypeSchema = z.enum([
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
export const WorkflowIOValueTypeEnum = WorkflowIOValueTypeSchema.enum;
// LLM Model Type - LLM 模型类型
export const LLMModelTypeSchema = z.enum(['all', 'classify', 'extractFields', 'toolCall']);
export const LLMModelTypeEnum = LLMModelTypeSchema.enum;
// Flow Node Output Type - 流程节点输出类型
export const FlowNodeOutputTypeSchema = z.enum(['hidden', 'source', 'static', 'dynamic', 'error']);
export const FlowNodeOutputTypeEnum = FlowNodeOutputTypeSchema.enum;

// InputConfig - 输入配置项
export const SecretInputItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  inputType: z.enum(['input', 'numberInput', 'secret', 'switch', 'select']),
  defaultValue: z.any().optional(),
  list: z
    .array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    )
    .optional()
});

export type SecretInputItemType = z.infer<typeof SecretInputItemSchema>;

// Input - 完整输入定义
export const InputSchema = z.object({
  key: z.string(),
  label: z.string(),
  referencePlaceholder: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  selectedTypeIndex: z.number().optional(),
  renderTypeList: z.array(FlowNodeInputTypeSchema),
  valueType: WorkflowIOValueTypeSchema,
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  toolDescription: z.string().optional(),
  canEdit: z.boolean().optional(),
  isPro: z.boolean().optional(),
  maxLength: z.number().optional(),
  canSelectFile: z.boolean().optional(),
  canSelectImg: z.boolean().optional(),
  maxFiles: z.number().optional(),
  inputList: z.array(SecretInputItemSchema).optional(),
  llmModelType: LLMModelTypeSchema.optional(),
  list: z
    .array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    )
    .optional(),
  markList: z
    .array(
      z.object({
        label: z.string(),
        value: z.number()
      })
    )
    .optional(),
  step: z.number().optional(),
  max: z.number().optional(),
  min: z.number().optional(),
  precision: z.number().optional()
});

// ============================================
// 输出配置相关
// ============================================

// Output - 输出定义
export const OutputSchema = z.object({
  id: z.string().optional(),
  type: FlowNodeOutputTypeSchema.optional(),
  key: z.string(),
  valueType: WorkflowIOValueTypeSchema,
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional()
});
export type OutputType = z.infer<typeof OutputSchema>;
