import { z } from 'zod';

export enum SSEMessageType {
  ERROR = 'error',
  DATA = 'data'
}

export enum StreamDataAnswerType {
  Answer = 'answer',
  FastAnswer = 'fastAnswer',
  Error = 'error'
}

export const SuccessDataSchema = z.object({
  output: z.record(z.any()).optional(),
  error: z.string().optional()
});

export const ErrorDataSchema = z.object({
  error: z.string(),
  message: z.string().optional()
});

export const SSEMessageSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerType),
  content: z.string()
});

export type SSEMessage = z.infer<typeof SSEMessageSchema>;
