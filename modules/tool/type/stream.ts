import { z } from 'zod';

export enum SSEMessageType {
  ERROR = 'error',
  SUCCESS = 'success',
  DATA = 'data'
}

export enum StreamDataAnswerType {
  Answer = 'answer',
  FastAnswer = 'fastAnswer'
}

export const StreamDataSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerType),
  content: z.string()
});

export const SuccessDataSchema = z.object({
  output: z.record(z.any()).optional(),
  error: z.string().optional()
});

export const ErrorDataSchema = z.object({
  error: z.string(),
  message: z.string().optional()
});

export const SSEMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(SSEMessageType.DATA),
    data: StreamDataSchema
  }),
  z.object({
    type: z.literal(SSEMessageType.SUCCESS),
    data: SuccessDataSchema
  }),
  z.object({
    type: z.literal(SSEMessageType.ERROR),
    data: ErrorDataSchema
  })
]);

export type SSEMessage = z.infer<typeof SSEMessageSchema>;
