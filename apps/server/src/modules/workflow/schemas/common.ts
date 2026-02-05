import type { TemplateItemType, TemplateListType } from '@fastgpt-plugin/helpers/workflows/schemas';
import { TemplateItemSchema as BaseTemplateItemSchema } from '@fastgpt-plugin/helpers/workflows/schemas';
import { z } from '@hono/zod-openapi';

// Re-export types
export { type TemplateItemType, type TemplateListType };

export const TemplateItemSchema = z.object(BaseTemplateItemSchema.shape).openapi('TemplateItem');
export const TemplateListSchema = z.array(TemplateItemSchema).openapi('TemplateList');
