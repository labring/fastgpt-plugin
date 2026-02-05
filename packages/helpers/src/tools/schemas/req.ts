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
    // version: z.string()
  }),
  tool: z.object({
    id: z.string(),
    version: z.string(),
    prefix: z.string().optional()
  }),
  time: z.string()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;

export const StreamMessageTypeEnum = z.enum(['response', 'error', 'stream']);
export const StreamDataAnswerTypeEnum = z.enum(['answer', 'fastAnswer']);

export const StreamDataSchema = z.object({
  type: StreamDataAnswerTypeEnum,
  content: z.string()
});

export type StreamDataType = z.infer<typeof StreamDataSchema>;

export const StreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: StreamMessageTypeEnum.enum.response,
    data: ToolHandlerReturnSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.enum.stream,
    data: StreamDataSchema
  }),
  z.object({
    type: StreamMessageTypeEnum.enum.error,
    data: z.string()
  })
]);

export type StreamMessageType = z.infer<typeof StreamMessageSchema>;

export const runToolSecondParams = z.object({
  systemVar: SystemVarSchema
});

export type RunToolSecondParamsType = z.infer<typeof runToolSecondParams>;

export const ToolHandlerFunctionSchema = z.function({
  input: [z.record(z.string(), z.unknown()), runToolSecondParams],
  output: z.promise(ToolHandlerReturnSchema)
});

export type ToolHandlerFunctionType = z.infer<typeof ToolHandlerFunctionSchema>;
