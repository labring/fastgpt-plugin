import { ErrorResponseDTOSchema } from '@interface-adapter/contracts/dto/common.dto';
import {
  ConnectionGatewayCreateSessionRequestDTOSchema,
  ConnectionGatewayCreateSessionResponseDTOSchema,
  ConnectionGatewayMetricsDTOSchema,
  ConnectionGatewayRequestAcceptedDTOSchema,
  ConnectionGatewayRequestDTOSchema,
  ConnectionGatewaySessionStatusViewDTOSchema
} from '@interface-adapter/contracts/dto/connection-gateway.dto';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import z from 'zod';

import { RegisteredError } from '@domain/value-objects/error.vo';
import { bearerHonoAuthMiddleware } from '@infrastructure/hono/middleware/auth';
import { loggerHonoMiddleware } from '@infrastructure/hono/middleware/logger';
import { createOpenAPIHono, createRoute, R } from '@infrastructure/hono/utils/response';

import type { ConnectionGatewayDeps } from './deps';

export function createConnectionGatewayApp(deps: Pick<ConnectionGatewayDeps, 'service'>) {
  const app = createOpenAPIHono();

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
  app.use('/metrics', bearerHonoAuthMiddleware);
  app.use('/internal/*', bearerHonoAuthMiddleware);

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'FastGPT Connection Gateway API',
      version: '1.0.0'
    },
    security: [{ bearerAuth: [] }]
  });

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer'
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      summary: 'Health check',
      tags: ['connection-gateway'],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.object({
                data: z.object({
                  status: z.string(),
                  timestamp: z.string()
                })
              })
            }
          }
        }
      }
    }),
    (c) => R.success(c, { status: 'ok', timestamp: new Date().toISOString() })
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/metrics',
      summary: 'Gateway metrics',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse(ConnectionGatewayMetricsDTOSchema)
      }
    }),
    (c) => R.success(c, deps.service.metrics())
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/internal/sessions',
      summary: 'Create a gateway session',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      request: jsonRequest(ConnectionGatewayCreateSessionRequestDTOSchema),
      responses: {
        200: jsonResponse(ConnectionGatewayCreateSessionResponseDTOSchema),
        400: errorResponse(),
        401: errorResponse(),
        429: errorResponse()
      }
    }),
    async (c) => {
      try {
        const body = ConnectionGatewayCreateSessionRequestDTOSchema.parse(c.req.valid('json'));
        const session = await deps.service.createSession(body);

        return R.success(c, { session });
      } catch (error) {
        return R.fail(c, statusFromError(error), normalizeError(error));
      }
    }
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/internal/sessions/:sessionId/status',
      summary: 'Get gateway session status',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse(ConnectionGatewaySessionStatusViewDTOSchema),
        404: errorResponse()
      }
    }),
    async (c) => {
      const status = await deps.service.getStatus(requiredParam(c.req.param('sessionId')));
      if (!status.session) {
        return R.fail(c, 404, 'Gateway session not found');
      }

      return R.success(c, status);
    }
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/internal/sessions/:sessionId/requests',
      summary: 'Publish a request envelope to a session mailbox',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      request: jsonRequest(ConnectionGatewayRequestDTOSchema),
      responses: {
        202: jsonResponse(ConnectionGatewayRequestAcceptedDTOSchema),
        400: errorResponse(),
        403: errorResponse(),
        404: errorResponse(),
        409: errorResponse(),
        413: errorResponse(),
        429: errorResponse()
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const parsed = ConnectionGatewayRequestDTOSchema.parse(body);
        const result = await deps.service.publishRequest({
          sessionId: requiredParam(c.req.param('sessionId')),
          envelope: parsed.envelope
        });

        return c.json({ data: result }, 202);
      } catch (error) {
        return R.fail(c, statusFromError(error), normalizeError(error));
      }
    }
  );

  app.openapi(
    createRoute({
      method: 'delete',
      path: '/internal/sessions/:sessionId',
      summary: 'Delete a gateway session',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse(z.object({ deleted: z.boolean() }))
      }
    }),
    async (c) => {
      await deps.service.deleteSession(requiredParam(c.req.param('sessionId')));
      return R.success(c, { deleted: true });
    }
  );

  return app;
}

function jsonRequest(schema: z.ZodType) {
  return {
    body: {
      content: {
        'application/json': {
          schema
        }
      }
    }
  };
}

function jsonResponse(schema: z.ZodType) {
  return {
    description: 'JSON response',
    content: {
      'application/json': {
        schema: z.object({ data: schema })
      }
    }
  };
}

function errorResponse() {
  return {
    description: 'Error response',
    content: {
      'application/json': {
        schema: z.object({ error: ErrorResponseDTOSchema })
      }
    }
  };
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function statusFromError(error: unknown): ContentfulStatusCode {
  if (error instanceof RegisteredError) {
    return error.httpStatus as ContentfulStatusCode;
  }

  return 500;
}

function requiredParam(value: string | undefined): string {
  if (!value) {
    throw new Error('Missing required route param');
  }

  return value;
}
