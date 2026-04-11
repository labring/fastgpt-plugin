import { R } from '@interface-adapter/http/http.type';
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const onError: ErrorHandler<Env> = (error, c) => {
  if (error instanceof HTTPException) {
    const message = error.status === 401 ? 'Unauthorized' : error.message;
    console.warn('HTTP Exception: ', error);
    c.get('logger').warn(`HTTP Exception: ${JSON.stringify(error, null, 2)}`, { error });
    c.status(error.status);
    return c.json(R.fail(error.status, { en: message }));
  }
  console.error('Internal Server Error: ', error);
  c.get('logger').error(`Internal Server Error: ${JSON.stringify(error, null, 2)}`, { error });
  return c.json(R.fail(500, { en: error.message || 'Internal Server Error' }));
};
