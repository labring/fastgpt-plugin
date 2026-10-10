import { z } from 'zod';

import {
  ToolDetailSchema,
  ToolListChildItemSchema,
  ToolListItemSchema
} from '@domain/ports/plugin/tool.port';

import {
  arrayQueryParam,
  booleanQueryParam,
  PluginSourceDTOSchema,
  SystemVarDTOSchema
} from './common.dto';

export { SystemVarDTOSchema };

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
