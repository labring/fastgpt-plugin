import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { createError, serializeError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { buildHttpRequestLogContext } from '../utils/request-log';
import { R } from '../utils/response';

export const onError: ErrorHandler<Env> = async (error, c) => {
  const requestBodySnapshot = c.get('requestBodySnapshot');
  if (error instanceof HTTPException) {
    const message = error.status === 401 ? 'Unauthorized' : error.message;
    console.warn('HTTP Exception: ', error);
    c.get('logger').warn(`HTTP Exception: ${message}`, {
      request: await buildHttpRequestLogContext(c, requestBodySnapshot),
      error: serializeError(error, { includeStack: true })
    });
    return R.fail(
      c,
      error.status,
      createError(error.status === 401 ? ErrorCode.unauthorized : ErrorCode.badRequest, {
        message,
        reason: {
          en: message,
          'zh-CN': message
        },
        cause: error
      })
    );
  }
  console.error('Internal Server Error: ', error);
  c.get('logger').error(`Internal Server Error: ${serializeError(error).message}`, {
    request: await buildHttpRequestLogContext(c, requestBodySnapshot),
    error: serializeError(error, { includeStack: true })
  });
  return R.fail(c, 500, createError(ErrorCode.internalServerError, { cause: error }));
};
