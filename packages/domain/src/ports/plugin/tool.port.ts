import z from 'zod';

import { PluginBaseSchema, type PluginTagType } from '../../entities/plugin.entity';
import { I18nStringSchema } from '../../value-objects/i18n-string.vo';
import {
  PluginSourceSchema,
  type PluginSourceType,
  type UserPluginIdType
} from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';
import type { StreamData } from '../../value-objects/stream.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '../../value-objects/tool.vo';

export const ToolListChildItemSchema = z.object({
  childId: z.string(),
  name: I18nStringSchema,
  description: I18nStringSchema.optional(),
  toolDescription: z.string()
});

export type ToolListChildItemType = z.infer<typeof ToolListChildItemSchema>;

export const ToolListItemSchema = z.object({
  ...PluginBaseSchema.omit({
    versionDescription: true,
    permission: true
  }).shape,
  source: PluginSourceSchema,
  toolDescription: z.string(),
  isToolset: z.boolean(),
  children: z.array(ToolListChildItemSchema).optional()
});

export type ToolListItemType = z.infer<typeof ToolListItemSchema>;

export type ToolListInputType = {
  tags?: PluginTagType[];
  op?: 'or' | 'and';
  sources?: PluginSourceType[];
};

export type ToolListOutputType = ToolListItemType[];

export const ToolDetailSchema = z.object({
  ...PluginBaseSchema.shape,
  source: PluginSourceSchema,
  toolDescription: z.string(),
  isToolset: z.boolean(),
  children: z
    .array(
      ToolListChildItemSchema.extend({
        icon: z.string(),
        inputSchema: z.any(),
        outputSchema: z.any()
      })
    )
    .optional(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  secretSchema: z.any().optional()
});

export type ToolDetailInputType = UserPluginIdType;
export type ToolDetailType = z.infer<typeof ToolDetailSchema>;

export interface ToolManagerPort {
  list(arg0: ToolListInputType): Promise<Result<ToolListOutputType>>;
  detail(arg0: ToolDetailInputType): Promise<Result<ToolDetailType>>;
  run(arg0: ToolRunInputType): Promise<Result<StreamData<ToolStreamMessageType>>>;
}
