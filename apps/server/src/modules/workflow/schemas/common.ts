import { z } from '@hono/zod-openapi';
import {
  TemplateItemSchema as BaseTemplateItemSchema,
  type TemplateItemType,
  type TemplateListType
} from '@/validates/workflow';

// Re-export types
export { type TemplateItemType, type TemplateListType };

// ==================== Workflow Template Schemas ====================
// Use z.object().extend() to convert standard zod schema to zod-openapi schema

export const TemplateItemSchema = z.object(BaseTemplateItemSchema.shape).openapi('TemplateItem');
export const TemplateListSchema = z.array(TemplateItemSchema).openapi('TemplateList');
