import { z } from 'zod';
import { I18nStringSchema } from '../../common/schemas/i18n';
import type { ToolHandlerFunctionType } from './req';
import { SecretInputItemSchema } from './fastgpt';
import { ToolPermissionEnumSchema } from './permission';

// ============================================
// 基础枚举和类型
// ============================================

// Tool Tags
export const ToolTagSchema = z.enum([
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
export const ToolTagEnum = ToolTagSchema.enum;

// ============================================
// 版本配置相关
// ============================================

// Version Item - 工具版本项
export const VersionListChildItemSchema = z.object({
  toolId: z.string(), // 子工具名称（不含路径前缀）
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional()
});

export const VersionListItemSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  // 单工具的 schema
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  // 工具集的子工具 schema 列表（与 inputSchema/outputSchema 互斥）
  children: z.array(VersionListChildItemSchema).optional()
});
export type VersionListItemType = z.infer<typeof VersionListItemSchema>;
export type VersionListChildItemType = z.infer<typeof VersionListChildItemSchema>;

// ============================================
// 回调相关
// ============================================

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
  tags: z.array(ToolTagSchema).optional(),
  icon: z.string(),
  author: z.string().optional(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  secretInputConfig: z.array(SecretInputItemSchema).optional(),
  handler: z.any(),
  filename: z.string(),
  etag: z.string().nonempty().optional(),
  permission: z.array(ToolPermissionEnumSchema).optional()
});

export type ToolType = z.infer<typeof ToolSchema> & {
  handler: ToolHandlerFunctionType;
};

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
      filename: true,
      readmeUrl: true,
      handler: true,
      etag: true,
      parentId: true
    }).shape,
    toolId: z.string().optional(),
    toolDescription: z.string().optional(),
    versionList: z.array(VersionListItemSchema).min(1).optional(), // 改为可选
    tags: z.array(ToolTagSchema).optional(),
    icon: z.string().optional(),
    author: z.string().optional(),
    tutorialUrl: z.url().optional(),
    secretInputConfig: z.array(SecretInputItemSchema).optional()
  })
  .transform((data) => {
    return {
      ...data,
      toolDescription: data.toolDescription ?? data.description.en
    };
  });

export type ToolConfigType = z.infer<typeof ToolConfigSchema>;

/**
 * 工具集配置
 */
export const ToolSetConfigSchema = z.object({
  ...ToolSetSchema.omit({
    filename: true,
    etag: true,
    children: true,
    readmeUrl: true
  }).shape,
  toolId: z.string().optional(),
  toolDescription: z.string().optional(),
  tags: z.array(ToolTagSchema).optional(),
  icon: z.string().optional(),
  author: z.string().optional(),
  tutorialUrl: z.url().optional(),
  secretInputConfig: z.array(SecretInputItemSchema).optional()
});

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;

// Tool Detail - 工具详情(用于 API 响应)
export const ToolDetailSchema = UnifiedToolSchema.pick({
  toolId: true,
  parentId: true,
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
  versionList: true,
  permission: true
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
// Manifest 配置相关（用于 manifest.yaml）
// ============================================

/**
 * 子工具配置 Schema
 */
export const ChildToolConfigSchema = z.object({
  name: I18nStringSchema,
  description: I18nStringSchema,
  icon: z.string().optional()
});

/**
 * Manifest 配置 Schema - 用于验证 manifest.yaml
 * 统一 tool 和 toolset，通过 children 字段区分
 */
export const ManifestSchema = z
  .object({
    type: z.literal('tool'),
    toolId: z.string(),
    name: I18nStringSchema,
    description: I18nStringSchema,
    toolDescription: z.string().optional(),
    version: z.string(),
    versionDescription: I18nStringSchema.optional(),
    tags: z.array(ToolTagSchema).optional(),
    icon: z.string().optional(),
    author: z.string().optional().default('FastGPT'),
    tutorialUrl: z.url().optional(),
    secretInputConfig: z.array(SecretInputItemSchema).optional(),
    // 子工具配置：key 为子工具名称，value 为子工具配置
    children: z.record(z.string(), ChildToolConfigSchema).optional()
  })
  .transform((data) => ({
    ...data,
    toolDescription: data.toolDescription ?? data.description.en ?? ''
  }));

/**
 * 构建全局唯一工具 ID。
 * 格式：`author@toolId@version`
 * 子工具格式：`author@toolId@version/childToolId`
 */
export function buildGlobalToolId(author: string, toolId: string, version: string): string {
  return `${author}@${toolId}@${version}`;
}

export type ManifestType = z.infer<typeof ManifestSchema>;
