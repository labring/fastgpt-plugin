import z from 'zod';
import type { SystemVarType } from './system-var.vo';
import type { InvokePort } from '../ports/invoke.port';

export const ToolHandlerReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});
export type ToolHandlerReturnType = z.infer<typeof ToolHandlerReturnSchema>;

export const ToolPermissionEnumSchema = z.enum([
  'userInfo:read',
  'teamInfo:read',
  'model:read',
  'dataset:read'
]);

export const ToolPermissionEnum = ToolPermissionEnumSchema.enum;
export type ToolPermissionEnumType = z.infer<typeof ToolPermissionEnumSchema>;

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
  // emitter: EventEmitter;
  systemVar: SystemVarType;
  /** 插件反向调用 Host 服务的入口 */
  invoke: InvokePort;
  [key: string]: unknown;
};

export type ToolHandlerFunctionType = (
  input: Record<string, unknown>,
  ctx: ToolContextType
) => Promise<ToolHandlerReturnType>;
