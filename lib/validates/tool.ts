import { z } from 'zod';
import { I18nStringSchema } from './i18n';

// FastGPT Enums
export enum FlowNodeInputTypeEnum {
  reference = 'reference',
  input = 'input',
  textarea = 'textarea',
  numberInput = 'numberInput',
  switch = 'switch',
  select = 'select',
  multipleSelect = 'multipleSelect',
  JSONEditor = 'JSONEditor',
  addInputParam = 'addInputParam',
  selectApp = 'selectApp',
  customVariable = 'customVariable',
  selectLLMModel = 'selectLLMModel',
  settingLLMModel = 'settingLLMModel',
  selectDataset = 'selectDataset',
  selectDatasetParamsModal = 'selectDatasetParamsModal',
  settingDatasetQuotePrompt = 'settingDatasetQuotePrompt',
  hidden = 'hidden',
  custom = 'custom',
  fileSelect = 'fileSelect'
}

export enum WorkflowIOValueTypeEnum {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  object = 'object',
  arrayString = 'arrayString',
  arrayNumber = 'arrayNumber',
  arrayBoolean = 'arrayBoolean',
  arrayObject = 'arrayObject',
  arrayAny = 'arrayAny',
  any = 'any',
  chatHistory = 'chatHistory',
  datasetQuote = 'datasetQuote',
  dynamic = 'dynamic',
  selectDataset = 'selectDataset',
  selectApp = 'selectApp'
}

export enum LLMModelTypeEnum {
  all = 'all',
  classify = 'classify',
  extractFields = 'extractFields',
  toolCall = 'toolCall'
}

export enum FlowNodeOutputTypeEnum {
  hidden = 'hidden',
  source = 'source',
  static = 'static',
  dynamic = 'dynamic',
  error = 'error'
}

// InputConfig
export const InputConfigSchema = z.object({
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
export type InputConfigType = z.infer<typeof InputConfigSchema>;

// Input
export const InputSchema = z.object({
  key: z.string(),
  label: z.string(),
  referencePlaceholder: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  selectedTypeIndex: z.number().optional(),
  renderTypeList: z.array(z.nativeEnum(FlowNodeInputTypeEnum)),
  valueType: z.nativeEnum(WorkflowIOValueTypeEnum),
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
  inputList: z.array(InputConfigSchema).optional(),
  llmModelType: z.nativeEnum(LLMModelTypeEnum).optional(),
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
export type InputType = z.infer<typeof InputSchema>;

// Output
export const OutputSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(FlowNodeOutputTypeEnum).optional(),
  key: z.string(),
  valueType: z.nativeEnum(WorkflowIOValueTypeEnum),
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional()
});
export type OutputType = z.infer<typeof OutputSchema>;

// Tool Tags
export const ToolTagEnum = z.enum([
  'tools',
  'search',
  'multimodal',
  'communication',
  'finance',
  'design',
  'productivity',
  'news',
  'entertainment',
  'social',
  'scientific',
  'other'
]);

// Version Item
export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  inputs: z.array(InputSchema),
  outputs: z.array(OutputSchema)
});

// Tool Config (Base)
export const ToolConfigSchema = z.object({
  isWorkerRun: z.boolean().default(false).optional(),
  toolId: z.string().optional(),
  name: I18nStringSchema,
  description: I18nStringSchema,
  toolDescription: z.string().optional(),
  versionList: z.array(VersionListItemSchema).min(1),
  tags: z.array(ToolTagEnum).optional(),
  icon: z.string().optional(),
  author: z.string().optional(),
  courseUrl: z.string().optional(),
  secretInputConfig: z.array(InputConfigSchema).optional()
});

// Tool (with ID and Icon)
export const ToolSchema = ToolConfigSchema.extend({
  toolId: z.string(),
  tags: z.array(ToolTagEnum).optional(),
  icon: z.string(),
  parentId: z.string().optional(),
  toolFilename: z.string().optional(),
  version: z.string().optional()
});

// Tool Detail (for API response)
export const ToolDetailSchema = ToolSchema.omit({
  isWorkerRun: true,
  toolFilename: true
});

// Tool Simple (for lists)
export const ToolSimpleSchema = ToolDetailSchema.omit({
  secretInputConfig: true,
  toolDescription: true,
  versionList: true
});

export type ToolDetailType = z.infer<typeof ToolDetailSchema>;
export type ToolSimpleType = z.infer<typeof ToolSimpleSchema>;
export type ToolType = z.infer<typeof ToolSchema>;
