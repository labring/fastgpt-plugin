import type { EventEmitter } from '@fastgpt-plugin/helpers/events/type';
import { z } from 'zod';

// ToolHandlerReturnSchema 定义移到这里，避免循环依赖
export const ToolHandlerReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});
export type ToolHandlerReturnType = z.infer<typeof ToolHandlerReturnSchema>;

export const SystemVarSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    contact: z.string(),
    membername: z.string(),
    teamName: z.string(),
    teamId: z.string(),
    name: z.string()
  }),
  app: z.object({
    id: z.string(),
    name: z.string()
  }),
  tool: z.object({
    id: z.string(),
    version: z.string(),
    prefix: z.string().optional(),
    accessToken: z.string().optional()
  }),
  time: z.string()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;

export const StreamMessageTypeSchema = z.enum(['response', 'error', 'stream']);
export const StreamMessageTypeEnum = StreamMessageTypeSchema.enum;

export const StreamDataAnswerTypeSchema = z.enum(['answer', 'fastAnswer']);
export const StreamDataAnswerTypeEnum = StreamDataAnswerTypeSchema.enum;

export const StreamDataSchema = z.object({
  type: StreamDataAnswerTypeSchema,
  content: z.string()
});

export type StreamDataType = z.infer<typeof StreamDataSchema>;

export const StreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: StreamMessageTypeEnum.response,
    data: ToolHandlerReturnSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.stream,
    data: StreamDataSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.error,
    data: z.string()
  })
]);

export type StreamMessageType = z.infer<typeof StreamMessageSchema>;

export type ToolContextType = {
  emitter: EventEmitter;
  systemVar: SystemVarType;
  [key: string]: unknown;
};

export type ToolHandlerFunctionType = (
  input: Record<string, unknown>,
  ctx: ToolContextType
) => Promise<ToolHandlerReturnType>;
