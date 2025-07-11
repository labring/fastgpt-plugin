import { z } from 'zod';

export const ToolOutputTypeSchema = z.union([
  z.object({
    output: z.record(z.any())
  }),
  z.object({
    error: z.string()
  })
]);

export enum StreamMessageTypeEnum {
  ERROR = 'error',
  DATA = 'data'
}

export enum StreamDataAnswerTypeEnum {
  Answer = 'answer',
  FastAnswer = 'fastAnswer'
}

export const StreamDataSchema = z.object({
  type: z.nativeEnum(StreamDataAnswerTypeEnum),
  content: z.string()
});

export const StreamMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(StreamMessageTypeEnum.ERROR),
    error: z.string()
  }),
  z.object({
    type: z.literal(StreamMessageTypeEnum.DATA),
    data: z.union([StreamDataSchema, ToolOutputTypeSchema])
  })
]);

export type StreamMessageType = z.infer<typeof StreamMessageSchema>;
