import z from 'zod';
import { I18nStringSchema } from '../value-objects/i18n-string.vo';
import { DatasetFormFieldConfigSchema } from '../value-objects/dataset.vo';

// 数据源完整配置
export const DatasetSourceConfigSchema = z.object({
  sourceId: z.string(),
  name: I18nStringSchema,
  icon: z.string(),
  iconOutline: z.string().optional(),
  description: I18nStringSchema.optional(),
  courseUrl: z.string().optional(),
  formFields: z.array(DatasetFormFieldConfigSchema)
});
