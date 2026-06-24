import { ErrorResponseDTOSchema } from '@interface-adapter/contracts/dto/common.dto';
import {
  ConnectionGatewayCreateSessionResponseDTOSchema,
  ConnectionGatewayMetricsDTOSchema,
  ConnectionGatewayRequestAcceptedDTOSchema,
  ConnectionGatewayRequestDTOSchema,
  ConnectionGatewaySessionStatusViewDTOSchema,
  ConnectionGatewayStreamRequestDTOSchema,
  ConnectionGatewayUpdateSessionMetadataRequestDTOSchema
} from '@interface-adapter/contracts/dto/connection-gateway.dto';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import z from 'zod';

import { RegisteredError } from '@domain/value-objects/error.vo';
import { gatewayEnv } from '@infrastructure/env';
import { createBearerHonoAuthMiddleware } from '@infrastructure/hono/middleware/auth';
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
  const gatewayAuthMiddleware = createBearerHonoAuthMiddleware(gatewayEnv.AUTH_TOKEN);
  app.use('/metrics', gatewayAuthMiddleware);
  app.use('/internal/*', gatewayAuthMiddleware);

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
      path: '/internal/sessions/by-source/:source/status',
      summary: 'Get latest gateway session status by source',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse(ConnectionGatewaySessionStatusViewDTOSchema),
        404: errorResponse()
      }
    }),
    async (c) => {
      const source = decodeURIComponent(requiredParam(c.req.param('source')));
      const status = await deps.service.getLatestStatusBySource(source);
      if (!status.session) {
        return R.fail(c, 404, 'Gateway session not found');
      }

      return R.success(c, status);
    }
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
      path: '/internal/sessions/:sessionId/requests:stream',
      summary: 'Publish a request envelope and stream response envelopes',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      request: jsonRequest(ConnectionGatewayStreamRequestDTOSchema),
      responses: {
        200: {
          description: 'NDJSON response envelope stream',
          content: {
            'application/x-ndjson': {
              schema: z.string()
            }
          }
        },
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
        const body = ConnectionGatewayStreamRequestDTOSchema.parse(c.req.valid('json'));
        const { responses } = await deps.service.publishRequestAndWait({
          sessionId: requiredParam(c.req.param('sessionId')),
          envelope: body.envelope,
          timeoutMs: body.timeoutMs
        });
        const encoder = new TextEncoder();

        return new Response(
          new ReadableStream<Uint8Array>({
            start: async (controller) => {
              try {
                for await (const envelope of responses) {
                  controller.enqueue(encoder.encode(`${JSON.stringify(envelope)}\n`));
                }
              } catch (error) {
                controller.error(error);
              } finally {
                controller.close();
              }
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/x-ndjson; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive'
            }
          }
        );
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
      method: 'patch',
      path: '/internal/sessions/:sessionId/metadata',
      summary: 'Update gateway session metadata',
      tags: ['connection-gateway'],
      security: [{ bearerAuth: [] }],
      request: jsonRequest(ConnectionGatewayUpdateSessionMetadataRequestDTOSchema),
      responses: {
        200: jsonResponse(ConnectionGatewayCreateSessionResponseDTOSchema),
        404: errorResponse()
      }
    }),
    async (c) => {
      try {
        const body = ConnectionGatewayUpdateSessionMetadataRequestDTOSchema.parse(
          c.req.valid('json')
        );
        const session = await deps.service.updateSessionMetadata({
          sessionId: requiredParam(c.req.param('sessionId')),
          metadata: body.metadata
        });

        return R.success(c, { session });
      } catch (error) {
        return R.fail(c, statusFromError(error), normalizeError(error));
      }
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
