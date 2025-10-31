import { z } from 'zod';

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
    version: z.string()
  }),
  time: z.string()
});

export type SystemVarType = z.infer<typeof SystemVarSchema>;

export const ToolCallbackReturnSchema = z.object({
  error: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  output: z.record(z.string(), z.any()).optional()
});

export type ToolCallbackReturnSchemaType = z.infer<typeof ToolCallbackReturnSchema>;

export enum StreamMessageTypeEnum {
  response = 'response',
  error = 'error',
  stream = 'stream'
}

export enum StreamDataAnswerTypeEnum {
  answer = 'answer',
  fastAnswer = 'fastAnswer'
}

export const StreamDataSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerTypeEnum),
  content: z.string()
});
export type StreamDataType = z.infer<typeof StreamDataSchema>;

export const StreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.response),
    data: ToolCallbackReturnSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.stream),
    data: StreamDataSchema
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.error),
    data: z.string()
  })
]);
export type StreamMessageType = z.infer<typeof StreamMessageSchema>;

export const runToolSecondParams = z.object({
  systemVar: SystemVarSchema,
  streamResponse: z.function().args(StreamDataSchema).returns(z.void()) // sendMessage
});

export type RunToolSecondParamsType = z.infer<typeof runToolSecondParams>;

export const ToolCallbackType = z
  .function()
  .args(z.any(), runToolSecondParams)
  .returns(z.promise(ToolCallbackReturnSchema));
