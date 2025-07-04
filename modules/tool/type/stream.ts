import { z } from 'zod';

export enum SSEMessageType {
  ANSWER = 'answer',
  FAST_ANSWER = 'fastAnswer',
  ERROR = 'error',
  SUCCESS = 'success'
}

export const SSEMessageSchema = z.object({
  type: z.nativeEnum(SSEMessageType),
  data: z.any().optional()
});

export type SSEMessage = z.infer<typeof SSEMessageSchema>;
