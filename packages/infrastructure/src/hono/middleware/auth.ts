import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { serverEnv } from '../../env';

const PREFIX = 'Bearer ';

function getBearerToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith(PREFIX)) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  return authHeader.slice(PREFIX.length);
}

export const createBearerHonoAuthMiddleware = (authToken: string) =>
  createMiddleware<Env>(async (c, next) => {
    const token = getBearerToken(c.req.header('Authorization'));
    if (token !== authToken) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    await next();
  });

export const bearerHonoAuthMiddleware = createMiddleware<Env>(async (c, next) => {
  const token = getBearerToken(c.req.header('Authorization'));
  if (token !== serverEnv.AUTH_TOKEN) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
});
