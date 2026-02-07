import { z } from 'zod';
import { I18nStringSchema } from '../common/schemas/i18n';

// ==================== Dataset Source Constants ====================

/**
 * Plugin Dataset Source ID 常量
 */
export const PluginDatasetSourceIds = {
  customApi: 'custom-api',
  feishu: 'feishu',
  yuque: 'yuque'
} as const;

export type PluginDatasetSourceId =
  (typeof PluginDatasetSourceIds)[keyof typeof PluginDatasetSourceIds];

// ==================== Dataset Source Enums ====================

export const DatasetSourceIdEnum = z.enum(['yuque', 'feishu', 'custom-api']);
export type DatasetSourceId = z.infer<typeof DatasetSourceIdEnum>;

// ==================== Form Field Schemas ====================

// 表单字段类型
export const FormFieldTypeEnum = z.enum(['input', 'password', 'select', 'tree-select']);

// 表单字段配置
export const FormFieldConfigSchema = z.object({
  key: z.string(),
  label: I18nStringSchema,
  type: FormFieldTypeEnum,
  required: z.boolean().optional(),
  placeholder: I18nStringSchema.optional(),
  description: I18nStringSchema.optional(),
  options: z
    .array(
      z.object({
        label: I18nStringSchema,
        value: z.string()
      })
    )
    .optional()
});

// ==================== Dataset Source Schemas ====================

// 数据源基本信息
export const DatasetSourceInfoSchema = z.object({
  sourceId: DatasetSourceIdEnum,
  name: I18nStringSchema,
  icon: z.string(),
  iconOutline: z.string().optional(),
  description: I18nStringSchema.optional(),
  courseUrl: z.string().optional()
});

// 数据源完整配置
export const DatasetSourceConfigSchema = DatasetSourceInfoSchema.extend({
  formFields: z.array(FormFieldConfigSchema)
});

// ==================== File Schemas ====================

// 文件列表项
export const FileItemSchema = z.object({
  id: z.string(),
  rawId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  type: z.enum(['file', 'folder']),
  updateTime: z.string().optional(),
  createTime: z.string().optional(),
  hasChild: z.boolean().optional()
});

// 文件内容响应
export const FileContentResponseSchema = z.object({
  title: z.string().optional(),
  rawText: z.string().optional(),
  previewUrl: z.string().optional()
});

// ==================== Type Exports ====================

export type FormFieldType = z.infer<typeof FormFieldTypeEnum>;
export type FormFieldConfig = z.infer<typeof FormFieldConfigSchema>;
export type DatasetSourceInfo = z.infer<typeof DatasetSourceInfoSchema>;
export type DatasetSourceConfig = z.infer<typeof DatasetSourceConfigSchema>;
export type FileItem = z.infer<typeof FileItemSchema>;
export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;
