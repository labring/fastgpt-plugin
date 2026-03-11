import { z } from 'zod';
export const InputSchema = z.object({});

export const OutputSchema = z.object({
  time: z.string()
});

export type Input = z.infer<typeof InputSchema>;
export type Output = z.infer<typeof OutputSchema>;
