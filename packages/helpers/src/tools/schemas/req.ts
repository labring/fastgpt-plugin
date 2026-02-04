import { z } from 'zod';
import { ToolCallbackReturnSchema } from './tool';

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
    data: ToolCallbackReturnSchema
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
  systemVar: SystemVarSchema,
  streamResponse: z.function({ input: [StreamDataSchema], output: z.void() })
});

export type RunToolSecondParamsType = z.infer<typeof runToolSecondParams>;

export const ToolHandlerFunctionSchema = z.function({
  input: [z.record(z.string(), z.unknown()), runToolSecondParams],
  output: z.promise(ToolCallbackReturnSchema)
});

export type ToolHandlerFunctionType = z.infer<typeof ToolHandlerFunctionSchema>;
