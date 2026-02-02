import { z } from 'zod';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  LLMModelTypeEnum,
  WorkflowIOValueTypeEnum
} from '../types/fastgpt';
import { I18nStringSchema } from '../../common/schemas/i18n';
import { ToolCallbackFunctionSchema } from './req';

// ============================================
// 基础枚举和类型
// ============================================

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

// ============================================
// 输入配置相关
// ============================================

// InputConfig - 输入配置项
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

// Input - 完整输入定义
export const InputSchema = z.object({
  key: z.string(),
  label: z.string(),
  referencePlaceholder: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  selectedTypeIndex: z.number().optional(),
  renderTypeList: z.array(FlowNodeInputTypeEnum),
  valueType: WorkflowIOValueTypeEnum,
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
  llmModelType: LLMModelTypeEnum.optional(),
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

// ============================================
// 输出配置相关
// ============================================

// Output - 输出定义
export const OutputSchema = z.object({
  id: z.string().optional(),
  type: FlowNodeOutputTypeEnum.optional(),
  key: z.string(),
  valueType: WorkflowIOValueTypeEnum,
  valueDesc: z.string().optional(),
  value: z.unknown().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional()
});
export type OutputType = z.infer<typeof OutputSchema>;

// ============================================
// 版本配置相关
// ============================================

// Version Item - 工具版本项
export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  inputs: z.array(InputSchema),
  outputs: z.array(OutputSchema)
});
export type VersionListItemType = z.infer<typeof VersionListItemSchema>;

// ============================================
// 回调相关
// ============================================

// Tool Callback Return - 工具回调返回值
export const ToolCallbackReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});
export type ToolCallbackReturnType = z.infer<typeof ToolCallbackReturnSchema>;

// ============================================
// 工具配置相关(从基础到复杂)
// ============================================

// Tool Config - 工具基础配置
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
export type ToolConfigType = z.infer<typeof ToolConfigSchema>;

// Tool Config With Callback - 带回调的工具配置
export const ToolConfigWithCbSchema = ToolConfigSchema.extend({
  cb: ToolCallbackFunctionSchema.describe('The callback function of the tool')
});
export type ToolConfigWithCbType = z.infer<typeof ToolConfigWithCbSchema>;

// Tool - 完整工具定义
export const ToolSchema = ToolConfigWithCbSchema.extend({
  // Required
  toolId: z.string().describe('The unique id of the tool'),
  tags: z.array(ToolTagEnum).optional().describe('The tags of the tool'),
  icon: z.string().describe('The icon of the tool'),

  // Computed
  parentId: z.string().optional().describe('The parent id of the tool'),
  toolFilename: z.string().describe('The filename of the tool'),
  version: z.string().describe('The version hash of the tool'),

  // ToolSet Parent
  secretInputConfig: z
    .array(InputConfigSchema)
    .optional()
    .describe('The secret input list of the tool')
});
export type ToolType = z.infer<typeof ToolSchema>;

// Tool Detail - 工具详情(用于 API 响应)
export const ToolDetailSchema = ToolSchema.omit({
  cb: true,
  isWorkerRun: true,
  toolFilename: true,
  versionList: true
}).extend({
  versionList: z.array(VersionListItemSchema).optional()
});
export type ToolDetailType = z.infer<typeof ToolDetailSchema>;

// Tool Simple - 简化工具信息(用于列表)
export const ToolSimpleSchema = ToolDetailSchema.omit({
  secretInputConfig: true,
  toolDescription: true,
  versionList: true
});
export type ToolSimpleType = z.infer<typeof ToolSimpleSchema>;

// ============================================
// 工具集相关
// ============================================

// ToolSet Config - 工具集配置
export const ToolSetConfigSchema = ToolConfigSchema.omit({
  versionList: true
})
  .extend({
    tags: z.array(ToolTagEnum).describe('The tags of the tool'),
    children: z.array(ToolConfigWithCbSchema).optional().describe('The children of the tool set')
  })
  .describe('The ToolSet Config Schema');
export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;

// ToolSet - 完整工具集定义
export const ToolSetSchema = ToolSchema.omit({
  cb: true,
  parentId: true,
  versionList: true
})
  .extend({
    children: z.array(ToolSchema).describe('The children of the tool set')
  })
  .describe('The ToolSet Schema');
export type ToolSetType = z.infer<typeof ToolSetSchema>;
