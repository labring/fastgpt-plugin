import { cors } from 'hono/cors';
import { createResponseSchema, R, createOpenAPIHono } from '@/utils/http';
import { bearerAuth } from 'hono/bearer-auth';
import { env } from '@/env';
import { HTTPException } from 'hono/http-exception';
import { createRoute, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { requestId } from 'hono/request-id';
import { logger } from '@/middlewares/logger';

import tool from '@/modules/tool/tool.route';
import models from '@/modules/model/model.route';
import workflow from '@/modules/workflow/workflow.route';
import dataset from '@/modules/dataset/dataset.route';

export const app = createOpenAPIHono<Env>();

// #region ============= security =================
// Register Bearer Auth security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Bearer token authentication'
});
// #endregion

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
  },
  security: [
    {
      bearerAuth: []
    }
  ]
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
    pageTitle: 'FastGPT Plugin API',
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
      securitySchemes: {
        bearerAuth: {
          token: 'test'
        }
      }
    }
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
app.route('/api', dataset);
app.route('/api', tool);

// #endregion

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const message = err.status === 401 ? 'Unauthorized' : err.message;
    c.status(err.status);
    return R.fail(c, {
      code: err.status,
      msg: message
    });
  }

  c.get('logger').error('Internal Server Error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  });

  return R.fail(c, {
    code: 500,
    msg: err.message || 'Internal Server Error'
  });
});

app.notFound((c) => {
  const method = c.req.method;
  const url = c.req.url;

  c.get('logger').warn(`Not found: ${method} ${url}`);

  return R.fail(c, { code: 404, msg: `Resource ${method} ${url} is not found` });
});
