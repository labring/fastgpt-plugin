import { z } from 'zod';
import { I18nStringSchema } from '../../common/schemas/i18n';
import { ToolHandlerFunctionSchema as ToolHandlerFunctionSchema } from './req';
import { InputSchema, OutputSchema, SecretInputItemSchema } from './fastgpt';

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
export const ToolHandlerReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});
export type ToolHandlerReturnSchema = z.infer<typeof ToolHandlerReturnSchema>;

/**
 * 工具的所有属性
 */
export const ToolSchema = z.object({
  toolId: z.string(),
  parentId: z.string().optional(),
  name: I18nStringSchema,
  description: I18nStringSchema,
  toolDescription: z.string(),
  versionList: z.array(VersionListItemSchema).optional(),
  tags: z.array(ToolTagEnum).optional(),
  icon: z.string(),
  author: z.string().optional(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  secretInputConfig: z.array(SecretInputItemSchema).optional(),
  handler: ToolHandlerFunctionSchema,
  filename: z.string(),
  etag: z.string()
});

export type ToolType = z.infer<typeof ToolSchema>;

/**
 * 工具集的所有属性
 */
export const ToolSetSchema = z.object({
  ...ToolSchema.omit({
    parentId: true,
    versionList: true,
    handler: true
  }).shape,
  toolId: z.string().refine((data) => !data.includes('/')),
  children: z.array(ToolSchema).min(1)
});

export type ToolSetType = z.infer<typeof ToolSetSchema>;

export const UnifiedToolSchema = z.object({
  ...ToolSchema.shape,
  ...ToolSetSchema.shape
});

export type UnifiedToolType = z.infer<typeof UnifiedToolSchema>;

/**
 * 构建产物中的 Tool 的类型
 */
export const ToolDistSchema = z.object({
  ...ToolSetSchema.omit({
    readmeUrl: true
  }).shape,
  icon: z.string().optional(),

  versionList: z.array(VersionListItemSchema).optional(),
  handler: ToolHandlerFunctionSchema.optional(),
  children: z
    .array(
      z.object({
        ...ToolSchema.omit({
          parentId: true,
          readmeUrl: true
        }).shape,
        icon: z.string().optional()
      })
    )
    .optional()
});

export type ToolDistType = z.infer<typeof ToolDistSchema>;

/**
 * 工具配置
 * defineTool 函数的参数, 继承自 ToolSchema, 部分参数会自动处理，因此是 optional
 */
export const ToolConfigSchema = z
  .object({
    ...ToolSchema.omit({
      handler: true,
      filename: true,
      readmeUrl: true
    }).shape,
    toolId: z.string().optional(),
    toolDescription: z.string().optional(),
    versionList: z.array(VersionListItemSchema).min(1),
    tags: z.array(ToolTagEnum).optional(),
    icon: z.string().optional(),
    author: z.string().optional(),
    tutorialLink: z.url().optional(),
    secretInputConfig: z.array(SecretInputItemSchema).optional()
  })
  .transform((data) => {
    return {
      ...data,
      toolDescription: data.toolDescription ?? data.description
    };
  });

export type ToolConfigType = z.infer<typeof ToolConfigSchema>;

/**
 * 工具集配置
 */
export const ToolSetConfigSchema = ToolSetSchema.extend({
  toolId: z.string().optional(),
  toolDescription: z.string().optional(),
  tags: z.array(ToolTagEnum).optional(),
  icon: z.string().optional(),
  author: z.string().optional(),
  tutorialLink: z.url().optional(),
  secretInputConfig: z.array(SecretInputItemSchema).optional()
});

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;

// Tool Detail - 工具详情(用于 API 响应)
export const ToolDetailSchema = UnifiedToolSchema.pick({
  toolId: true,
  name: true,
  description: true,
  toolDescription: true,
  author: true,
  tags: true,
  icon: true,
  tutorialUrl: true,
  readmeUrl: true,
  secretInputConfig: true,
  etag: true,
  versionList: true
});

export type ToolDetailType = z.infer<typeof ToolDetailSchema>;

// Tool Simple - 简化工具信息(用于列表)
export const ToolSimpleSchema = ToolDetailSchema.omit({
  secretInputConfig: true,
  toolDescription: true,
  versionList: true
});

export type ToolSimpleType = z.infer<typeof ToolSimpleSchema>;
