import { cors } from 'hono/cors';
import models from '@model/route';
import workflow from '@workflow/route';
import tool from '@tool/route';
import { createResponseSchema, R, createOpenAPIHono } from '@/utils/http';
import { bearerAuth } from 'hono/bearer-auth';
import { env } from '@/env';
import { HTTPException } from 'hono/http-exception';
import { createRoute, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { requestId } from 'hono/request-id';
import { logger } from '@/middlewares/logger';

export const app = createOpenAPIHono<Env>();

// #region ============= middlewares =================
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })
);
app.use('/api/*', bearerAuth({ token: env.AUTH_TOKEN }));
app.use('*', requestId());
app.use('*', logger);
// #endregion

// #region ============= route =================
app.doc31('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'FastGPT Plugin API',
    version: '1.0.0',
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
    }
  }
});

app.get(
  '/openapi',
  Scalar({
    title: 'FastGPT Plugin API',
    url: '/openapi.json',
    defaultOpenAllTags: true,
    expandAllModelSections: true,
    expandAllResponses: true,
    favicon: '/public/favicon.ico',
    pageTitle: 'FastGPT Plugin API'
  })
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    description: 'Health check probe for the server',
    summary: 'Health check',
    tags: ['Health'],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: createResponseSchema(
              z.object({
                status: z.string(),
                timestamp: z.string()
              })
            )
          }
        }
      }
    }
  }),
  (c) => {
    return c.json(R.success({ status: 'ok', timestamp: new Date().toISOString() }), 200);
  }
);

app.route('/api', models);
app.route('/api', workflow);
app.route('/api', tool);
// #endregion

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    const message = error.status === 401 ? 'Unauthorized' : error.message;

    console.warn('HTTP Exception: ', error);
    c.get('logger').warn(`HTTP Exception: ${JSON.stringify(error, null, 2)}`, { error });

    c.status(error.status);
    return R.fail(c, { code: error.status, msg: message });
  }

  console.error('Internal Server Error: ', error);
  c.get('logger').error(`Internal Server Error: ${JSON.stringify(error, null, 2)}`, { error });
  return R.fail(c, { code: 500, msg: error.message || 'Internal Server Error' });
});

app.notFound((c) => {
  const method = c.req.method;
  const url = c.req.url;

  c.get('logger').warn(`Not found: ${method} ${url}`);

  return R.fail(c, { code: 404, msg: `Resource ${method} ${url} is not found` });
});
