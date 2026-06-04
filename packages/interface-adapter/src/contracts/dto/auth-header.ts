import { z } from 'zod';

export const AuthTokenHeader = z.object({
  Authorization: z.string()
});
