import z from 'zod';

import { PluginSourceSchema } from './plugin.vo';
import { SystemVarSchema } from './system-var.vo';

export const ToolHandlerReturnSchema = z.record(z.string(), z.unknown());
export type ToolHandlerReturnType = z.infer<typeof ToolHandlerReturnSchema>;

export const StreamMessageTypeSchema = z.enum(['response', 'error', 'stream']);
export const StreamMessageTypeEnum = StreamMessageTypeSchema.enum;

export const StreamDataAnswerTypeSchema = z.enum(['answer', 'fastAnswer']);
export const StreamDataAnswerTypeEnum = StreamDataAnswerTypeSchema.enum;

export const ToolAnswerSchema = z.object({
  type: StreamDataAnswerTypeSchema,
  content: z.string()
});

export type ToolAnswerType = z.infer<typeof ToolAnswerSchema>;

export const ToolStreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.response),
    data: ToolHandlerReturnSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.stream),
    data: ToolAnswerSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.error),
    data: z.string()
  })
]);

export type ToolStreamMessageType = z.infer<typeof ToolStreamMessageSchema>;

export const ToolRunInputSchema = z.object({
  pluginId: z.string(),
  version: z.preprocess((value) => {
    if (value === '') return undefined;
    return value;
  }, z.string().optional()),
  source: PluginSourceSchema.optional(),
  childId: z.string().optional(), // 工具集时存在
  input: z.record(z.string(), z.unknown()),
  secrets: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarSchema
});

export type ToolRunInputType = z.infer<typeof ToolRunInputSchema>;
