import z from 'zod';

import { type PluginTagType } from '../../entities/plugin.entity';
import { ToolSchema, ToolSetChildItemSchema } from '../../entities/tool.entity';
import {
  PluginSourceSchema,
  type PluginSourceType,
  UserPluginIdSchema
} from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';
import type { StreamData } from '../../value-objects/stream.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '../../value-objects/tool.vo';

export const ToolListChildItemSchema = z.object({
  id: ToolSetChildItemSchema.shape.id,
  name: ToolSetChildItemSchema.shape.name,
  description: ToolSetChildItemSchema.shape.description,
  toolDescription: ToolSetChildItemSchema.shape.toolDescription
});

export type ToolListChildItemType = z.infer<typeof ToolListChildItemSchema>;

export const ToolListItemSchema = z.object({
  ...ToolSchema.omit({
    inputSchema: true,
    outputSchema: true,
    secretSchema: true,
    children: true,
    versionDescription: true,
    permission: true
  }).shape,
  source: PluginSourceSchema,
  isToolset: z.boolean(),
  hasSecret: z.boolean(),
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
  ...ToolSchema.shape,
  source: PluginSourceSchema,
  isLatestVersion: z.boolean(),
  isToolset: z.boolean()
});

export const ToolDetailInputSchema = UserPluginIdSchema.extend({
  fallbackLatestVersion: z.boolean().optional()
});

export type ToolDetailInputType = z.infer<typeof ToolDetailInputSchema>;
export type ToolDetailType = z.infer<typeof ToolDetailSchema>;

export interface ToolManagerPort {
  list(arg0: ToolListInputType): Promise<Result<ToolListOutputType>>;
  detail(arg0: ToolDetailInputType): Promise<Result<ToolDetailType>>;
  run(arg0: ToolRunInputType): Promise<Result<StreamData<ToolStreamMessageType>>>;
}
