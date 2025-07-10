import { z } from 'zod';

export enum StreamMessageType {
  ERROR = 'error',
  DATA = 'data'
}

export enum StreamDataAnswerType {
  Answer = 'answer',
  FastAnswer = 'fastAnswer',
  Error = 'error'
}

export const StreamMessageSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerType),
  content: z.string()
});

export type StreamMessage = z.infer<typeof StreamMessageSchema>;
