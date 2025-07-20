import { z } from 'zod';

export const OutputType = z.object({
  url: z.string()
});
