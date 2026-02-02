import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { env } from '@/env';

const PREFIX = 'Bearer ';

export const bearerAuth = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith(PREFIX)) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const token = authHeader.slice(PREFIX.length);
  if (token !== env.AUTH_TOKEN) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
});
