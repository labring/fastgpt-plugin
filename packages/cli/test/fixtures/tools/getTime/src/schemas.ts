import { z } from 'zod';

export const InputType = z.object({});

export const OutputType = z.object({
  time: z.string()
});
