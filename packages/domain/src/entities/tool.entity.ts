import z from 'zod';

import { TolerantI18nStringSchema } from '../value-objects/i18n-string.vo';

import { PluginBaseSchema, PluginTypeEnum } from './plugin-base.entity';

export const ToolDescriptionSchema = z.union([z.string(), TolerantI18nStringSchema]);

export const ToolSetChildItemSchema = z.object({
  id: z.string(),
  name: TolerantI18nStringSchema,
  description: TolerantI18nStringSchema.optional(),
  icon: z.string(),
  toolDescription: ToolDescriptionSchema,
  inputSchema: z.any(),
  outputSchema: z.any()
});

export const ToolSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  // in data
  toolDescription: ToolDescriptionSchema,
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  secretSchema: z.any().optional(),
  children: z.array(ToolSetChildItemSchema).optional()
});

export const ToolSetSchema = z.object({
  ...PluginBaseSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  meta: z.object({
    secretSchema: z.any().optional(),
    toolDescription: ToolDescriptionSchema
  })
});

export type ToolType = z.output<typeof ToolSchema>;
