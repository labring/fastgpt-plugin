import type { NotFoundHandler } from 'hono';

import { R } from '../utils/response';

export const onNotFound: NotFoundHandler<Env> = (c) => {
  const method = c.req.method;
  const url = c.req.url;

  c.get('logger').warn(`Not found: ${method} ${url}`);

  return R.fail(c, 404, {
    en: `Resource ${method} ${url} is not found`,
    'zh-CN': `资源 ${method} ${url} 未找到`
  });
};
