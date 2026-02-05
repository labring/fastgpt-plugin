import { http } from '@/lib/logger';
import { withContext, getLogger } from '@logtape/logtape';
import { createMiddleware } from 'hono/factory';

export const logger = createMiddleware<Env>(async (c, next) => {
  const requestId = c.get('requestId');
  const path = c.req.path;
  const method = c.req.method;
  const start = performance.now();

  await withContext({ requestId }, async () => {
    const logger = getLogger(http.req).with({
      method,
      path,
      requestId
    });

    c.set('logger', logger);

    logger.info(`[${method}] ${path}`);

    await next();

    const status = c.res.status;
    const elapsed = (performance.now() - start).toFixed(2);

    getLogger(http.res).info(`[${method}] ${path} - ${status} ${elapsed}ms`, {
      method,
      path,
      status,
      elapsed: `${elapsed}ms`
    });
  });
});
