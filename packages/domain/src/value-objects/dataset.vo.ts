import z from 'zod';
import { I18nStringSchema } from './i18n-string.vo';

// 表单字段类型
export const DatasetFormFieldTypeSchema = z.enum(['input', 'password', 'select', 'tree-select']);
export const DatasetFormFieldTypeEnum = DatasetFormFieldTypeSchema.enum;
export type DatasetFormFieldTypeType = z.infer<typeof DatasetFormFieldTypeSchema>;

export const DatasetFormFieldConfigSchema = z.object({
  key: z.string(),
  label: I18nStringSchema,
  type: DatasetFormFieldTypeSchema,
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

// 文件列表项
export const DatasetFileItemSchema = z.object({
  id: z.string(),
  rawId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  name: z.string(),
  type: z.enum(['file', 'folder']),
  updateTime: z.string().optional(),
  createTime: z.string().optional(),
  hasChild: z.boolean().optional()
});
export type DatasetFileItemType = z.infer<typeof DatasetFileItemSchema>;

// 文件内容响应
export const DatasetFileContentResponseSchema = z.object({
  title: z.string().optional(),
  rawText: z.string().optional(),
  previewUrl: z.string().optional()
});

export type DatasetFileContentResponseType = z.infer<typeof DatasetFileContentResponseSchema>;
