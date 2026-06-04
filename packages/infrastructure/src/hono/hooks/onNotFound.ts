import type { NotFoundHandler } from 'hono';

import { createError } from '@domain/value-objects/error.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { R } from '../utils/response';

export const onNotFound: NotFoundHandler<Env> = (c) => {
  const method = c.req.method;
  const url = c.req.url;

  c.get('logger').warn(`Not found: ${method} ${url}`);

  return R.fail(
    c,
    404,
    createError(ErrorCode.notFound, {
      message: `Resource ${method} ${url} is not found`,
      reason: {
        en: `Resource ${method} ${url} is not found`,
        'zh-CN': `资源 ${method} ${url} 未找到`
      },
      data: { method, url }
    })
  );
};
