import z from 'zod';
import { ToolSchema, ToolSetChildItemSchema } from '@fastgpt-plugin/domain/entities/tool.entity';
import { ToolTagsNameMap } from '../tools/constants';
import { SystemVarSchema } from '@fastgpt-plugin/domain/value-objects/system-var.vo';
import { PluginUniqueIdSchema } from '@fastgpt-plugin/domain/value-objects/plugin-unique-id.vo';

export const ToolListItemSchema = z.object({
  ...ToolSchema.omit({
    inputSchema: true,
    outputSchema: true,
    secretSchema: true
  }).shape,
  versions: z.array(z.string()),

  children: z
    .array(
      z.object({
        ...ToolSetChildItemSchema.omit({
          inputSchema: true,
          outputSchema: true,
          toolDescription: true
        }).shape
      })
    )
    .optional()
});

export type ToolListItemType = z.infer<typeof ToolListItemSchema>;

export const ToolDetailSchema = z.object({
  ...ToolSchema.shape,
  children: ToolSetChildItemSchema.optional()
});

export type ToolDetailType = z.infer<typeof ToolDetailSchema>;

export const ToolTagListSchema = z.object({
  ...ToolTagsNameMap
});

export type ToolTagListType = z.infer<typeof ToolTagListSchema>;

export const DeleteToolQuerySchema = z.object({
  pluginId: z.string(),
  toolId: z.string()
});

export type DeleteToolQueryType = z.infer<typeof DeleteToolQuerySchema>;

export const ToolRunBodySchema = z.object({
  ...PluginUniqueIdSchema.shape,
  inputs: z.record(z.string(), z.any()).optional(),
  secrets: z.record(z.string(), z.any()).optional(),
  systemVar: SystemVarSchema
});

export type ToolRunBodyType = z.infer<typeof ToolRunBodySchema>;
