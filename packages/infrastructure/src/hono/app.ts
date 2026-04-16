import { createRoute, z } from '@hono/zod-openapi';
import { R } from '@interface-adapter/http/http.type';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';

import { onError } from './hooks/onError';
import { onNotFound } from './hooks/onNotFound';
import { bearerHonoAuthMiddleware } from './middleware/auth';
import { loggerHonoMiddleware } from './middleware/logger';
import { createOpenAPIHono } from './utils/response';

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
app.use('*', requestId());
app.use('*', loggerHonoMiddleware);
app.use('/api/*', bearerHonoAuthMiddleware);
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
            schema: z.object({
              data: z
                .object({
                  status: z.string(),
                  timestamp: z.string()
                })
                .openapi({
                  description: 'Health status data',
                  example: {
                    status: 'ok',
                    timestamp: '2024-01-01T00:00:00.000Z'
                  }
                })
            })
          }
        }
      }
    }
  }),
  (c) => {
    return c.json(R.success({ status: 'ok', timestamp: new Date().toISOString() }).body, 200);
  }
);

// #endregion

app.onError(onError);

app.notFound(onNotFound);
