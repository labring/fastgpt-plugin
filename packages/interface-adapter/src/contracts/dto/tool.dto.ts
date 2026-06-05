import { z } from 'zod';

import {
  ToolDetailSchema,
  ToolListChildItemSchema,
  ToolListItemSchema
} from '@domain/ports/plugin/tool.port';
import { SystemVarSchema } from '@domain/value-objects/system-var.vo';

const PluginSourceDTOSchema = z.string();
const PluginTagDTOSchema = z.enum([
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

const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

const booleanQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }, schema);

export const SystemVarDTOSchema = z.object({
  ...SystemVarSchema.shape
});

export const ToolRunInputDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(),
  source: z.string().optional(),
  secrets: z.record(z.string(), z.any()).optional(),
  systemVar: SystemVarDTOSchema,
  input: z.record(z.string(), z.unknown()),
  childId: z.string().optional()
});

export type ToolRunInputDTOType = z.infer<typeof ToolRunInputDTOSchema>;

export const ToolListChildItemDTOSchema = z.object({
  ...ToolListChildItemSchema.shape
});

export type ToolListChildItemDTOType = z.infer<typeof ToolListChildItemDTOSchema>;

export const ToolListItemDTOSchema = z.object({
  ...ToolListItemSchema.shape,
  children: z.array(ToolListChildItemDTOSchema).optional()
});

export type ToolListItemDTOType = z.infer<typeof ToolListItemDTOSchema>;

export const ToolListDTOSchema = z.array(ToolListItemDTOSchema);
export type ToolListDTOType = z.infer<typeof ToolListDTOSchema>;

export const ToolDetailDTOSchema = z.object({
  ...ToolDetailSchema.shape
});

export type ToolDetailDTOType = z.infer<typeof ToolDetailDTOSchema>;

export const ToolGetParamsDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(),
  source: PluginSourceDTOSchema.optional().default('system'),
  fallbackLatestVersion: booleanQueryParam(z.boolean().optional())
});

export type ToolGetParamsDTOType = z.infer<typeof ToolGetParamsDTOSchema>;

export const ToolListParamsDTOSchema = z.object({
  tags: arrayQueryParam(PluginTagDTOSchema),
  op: z.enum(['or', 'and']).optional(),
  sources: arrayQueryParam(PluginSourceDTOSchema)
});

export type ToolListParamsDTOType = z.infer<typeof ToolListParamsDTOSchema>;
