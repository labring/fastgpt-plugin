import { createMiddleware } from 'hono/factory';

import { serializeError } from '@domain/value-objects/error.vo';

import { getLogger, http, withContext } from '../../logger';
import { buildHttpRequestLogContext, createHttpRequestBodySnapshot } from '../utils/request-log';

export const loggerHonoMiddleware = createMiddleware<Env>(async (c, next) => {
  const requestId = c.get('requestId');
  const path = c.req.path;
  const method = c.req.method;
  const start = performance.now();
  const bodySnapshot = createHttpRequestBodySnapshot(c.req.raw);
  c.set('requestBodySnapshot', bodySnapshot);

  await withContext({ requestId }, async () => {
    const logger = getLogger(http.req).with({
      method,
      path,
      requestId
    });

    c.set('logger', logger);

    logger.info(`[${method}] ${path}`);

    try {
      await next();
    } catch (error) {
      logger.error(`[${method}] ${path} handler failed`, {
        request: await buildHttpRequestLogContext(c, bodySnapshot),
        error: serializeError(error, { includeStack: true })
      });
      throw error;
    }

    const status = c.res.status;
    const elapsed = (performance.now() - start).toFixed(2);
    const responseLogger = getLogger(http.res);

    responseLogger.info(`[${method}] ${path} - ${status} ${elapsed}ms`, {
      method,
      path,
      status,
      elapsed: `${elapsed}ms`
    });

    if (status >= 400) {
      const properties = {
        method,
        path,
        status,
        elapsed: `${elapsed}ms`,
        request: await buildHttpRequestLogContext(c, bodySnapshot)
      };
      if (status >= 500) {
        responseLogger.error(`[${method}] ${path} failed - ${status} ${elapsed}ms`, properties);
      } else {
        responseLogger.warn(`[${method}] ${path} failed - ${status} ${elapsed}ms`, properties);
      }
    }
  });
});
