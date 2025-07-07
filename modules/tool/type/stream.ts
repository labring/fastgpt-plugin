import { z } from 'zod';

export enum SSEMessageType {
  ERROR = 'error',
  SUCCESS = 'success',
  DATA = 'data'
}

export const SSEMessageSchema = z.object({
  type: z.nativeEnum(SSEMessageType),
  data: z.any().optional()
});

export type SSEMessage = z.infer<typeof SSEMessageSchema>;
