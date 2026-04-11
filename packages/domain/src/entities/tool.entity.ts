import z from 'zod';

import { I18nStringSchema } from '../value-objects/i18n-string.vo';

import { PluginBaseSchema, PluginTypeEnum } from './plugin-base.entity';

export const ToolSetChildItemSchema = z.object({
  id: z.string(),
  name: I18nStringSchema,
  description: I18nStringSchema.optional(),
  icon: z.string(),
  toolDescription: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any()
});

export const ToolSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  meta: z.object({
    toolDescription: z.string(),
    inputSchema: z.any().optional(),
    outputSchema: z.any().optional(),
    secretSchema: z.any().optional(),
    children: z.array(ToolSetChildItemSchema).optional()
  })
});

export const ToolSetSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  meta: z.object({
    secretSchema: z.any().optional(),
    toolDescription: z.string()
  })
});

export type ToolType = z.output<typeof ToolSchema>;
