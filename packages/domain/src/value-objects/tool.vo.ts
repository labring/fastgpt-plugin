import z from 'zod';

import { SystemVarSchema } from './system-var.vo';
import { UserPluginIdSchema } from './plugin.vo';

export const ToolHandlerReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});
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
    type: StreamMessageTypeEnum.response,
    data: ToolHandlerReturnSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.stream,
    data: ToolAnswerSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.error,
    data: z.string()
  })
]);

export type ToolStreamMessageType = z.infer<typeof ToolStreamMessageSchema>;

export const ToolRunContextSchema = z.object({
  systemVar: z.record(z.string(), z.unknown())
});

export const ToolRunInputSchema = z.object({
  ...UserPluginIdSchema.shape,
  childId: z.string().optional(), // 工具集时存在
  input: z.record(z.string(), z.unknown()),
  secret: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarSchema
});

export type ToolRunInputType = z.infer<typeof ToolRunInputSchema>;
