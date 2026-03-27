import z from 'zod';
import { PluginSchema, PluginTypeEnum } from './plugin.entity';
import { I18nStringSchema } from '../value-objects/i18n-string.vo';

export const ToolSchema = z.object({
  ...PluginSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  meta: z.object({
    toolDescription: z.string(),
    inputSchema: z.any(),
    outputSchema: z.any(),
    secretSchema: z.any().optional()
  })
});

export const ToolSetChildItemSchema = z.object({
  id: z.string().optional(),
  name: I18nStringSchema,
  description: I18nStringSchema.optional(),
  icon: z.string(),
  toolDescription: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any()
});

export const ToolSetSchema = z.object({
  ...PluginSchema.shape,
  type: z.literal(PluginTypeEnum.tool),

  meta: z.object({
    secretSchema: z.any().optional(),
    toolDescription: z.string(),
    children: z.array(ToolSetChildItemSchema)
  })
});

export type ToolType = z.output<typeof ToolSchema>;
