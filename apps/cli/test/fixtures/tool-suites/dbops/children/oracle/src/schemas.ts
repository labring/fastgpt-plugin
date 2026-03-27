import { z } from 'zod';

export const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  message: z.string()
});
export type Output = z.infer<typeof OutputSchema>;
