import { z } from 'zod';

export const InputSchema = z.object({});
export type Input = z.input<typeof InputSchema>;

export const OutputSchema = z.object({
  message: z.string()
});
export type Output = z.output<typeof OutputSchema>;
