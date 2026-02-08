import { z } from 'zod';

export const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export const OutputSchema = z.object({
  time: z.string().nonempty()
});
export type Output = z.infer<typeof OutputSchema>;
