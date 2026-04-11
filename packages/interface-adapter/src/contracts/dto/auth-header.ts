import { z } from '@hono/zod-openapi';

export const AuthTokenHeader = z.object({
  Authorization: z.string().openapi({
    description: 'JWK based authentication token',
    example: 'Bearer xxxxxx'
  })
});
