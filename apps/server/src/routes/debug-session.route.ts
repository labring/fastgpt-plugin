import {
  PluginDebugSessionCreateRequestDTOSchema,
  PluginDebugSessionRevokeRequestDTOSchema,
  PluginDebugSessionTicketExchangeRequestDTOSchema
} from '@interface-adapter/contracts/dto/plugin-debug-session.dto';
import { PluginDebugSessionContract } from '@interface-adapter/contracts/route/plugin-debug-session.contract';
import z from 'zod';

import type { PluginDebugSessionPort } from '@domain/ports/plugin/plugin-debug-session.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { ConnectionGatewaySessionSchema } from '@domain/value-objects/connection-gateway.vo';
import { HmacConnectionGatewayToken } from '@infrastructure/connection-gateway/token';
import { serverEnv } from '@infrastructure/env';
import { createOpenAPIHono, createRoute, R } from '@infrastructure/hono/utils/response';
import { getLogger, mod } from '@infrastructure/logger';

export type DebugSessionRouteDeps = {
  pluginDebugSessionRepo: PluginDebugSessionPort;
  pluginRepo: PluginRepoPort;
};

const DebugSessionStatusQuerySchema = z.object({
  tmbId: z.string().min(1)
});

const gatewayTokenSigner = new HmacConnectionGatewayToken(serverEnv.JWT_SECRET);

export const makeDebugSessionRoute = (deps: DebugSessionRouteDeps) => {
  const route = createOpenAPIHono();
  const logger = getLogger(mod.plugin);

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.Create.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginDebugSessionCreateRequestDTOSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Create.response[200]!
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Create.response[400]!
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const ttlMs = body.ttlMs ?? serverEnv.CONNECTION_GATEWAY_DEBUG_SESSION_TTL_MS;
        const connectKeyTtlMs = ttlMs;
        const { session, connectKey } = await deps.pluginDebugSessionRepo.create({
          tmbId: body.tmbId,
          ttlMs,
          connectKeyTtlMs
        });

        return R.success(c, {
          debugSessionId: session.debugSessionId,
          tmbId: session.tmbId,
          source: session.source,
          connectKey,
          connectKeyExpiresAt: Date.now() + connectKeyTtlMs,
          ticket: connectKey,
          ticketExpiresAt: Date.now() + connectKeyTtlMs,
          expiresAt: session.expiresAt
        });
      } catch (error) {
        logger.error('Create debug session failed', { error });
        return R.fail(c, 400, error instanceof Error ? error : String(error));
      }
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.ExchangeTicket.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginDebugSessionTicketExchangeRequestDTOSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.ExchangeTicket.response[200]!
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.ExchangeTicket.response[400]!
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.ExchangeTicket.response[404]!
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const { session } = await deps.pluginDebugSessionRepo.exchangeConnectKey(
          body.connectKey ?? body.ticket ?? ''
        );
        const connectToken = await gatewayTokenSigner.sign({
          consumerType: 'plugin-debug',
          subject: session.tmbId,
          sessionScope: {
            userId: session.tmbId,
            source: session.source
          },
          transport: 'tcp',
          capabilities: ['gateway.bind', 'invoke'],
          issuedAt: Date.now(),
          expiresAt: session.expiresAt
        });
        if (session.gatewaySessionId) {
          await deleteGatewaySession(session.gatewaySessionId).catch((error) => {
            logger.warn('Delete stale gateway session before connect failed', {
              debugSessionId: session.debugSessionId,
              gatewaySessionId: session.gatewaySessionId,
              error
            });
          });
        }
        const gatewaySession = await createGatewaySession({
          token: connectToken,
          source: session.source
        });
        await deps.pluginDebugSessionRepo.setGatewaySession({
          tmbId: session.tmbId,
          debugSessionId: session.debugSessionId,
          gatewaySessionId: gatewaySession.id
        });

        return R.success(c, {
          tcpUrl: serverEnv.CONNECTION_GATEWAY_TCP_URL,
          source: session.source,
          sessionId: gatewaySession.id,
          session: gatewaySession,
          connectToken,
          expiresAt: session.expiresAt
        });
      } catch (error) {
        logger.error('Exchange debug session connect key failed', { error });
        return R.fail(c, 404, error instanceof Error ? error : String(error));
      }
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.Status.meta,
      request: {
        query: DebugSessionStatusQuerySchema
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Status.response[200]!
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Status.response[404]!
            }
          }
        }
      }
    }),
    async (c) => {
      const query = c.req.valid('query');
      const debugSessionId = requiredParam(c.req.param('debugSessionId'));
      const session = await deps.pluginDebugSessionRepo.get({
        tmbId: query.tmbId,
        debugSessionId
      });

      if (!session) {
        return R.fail(c, 404, 'Debug session not found');
      }

      const gatewayStatus = await getGatewayStatusBySource(session.source).catch(() => null);
      const [plugins] =
        gatewayStatus?.session && gatewayStatus.ownerAlive
          ? await deps.pluginRepo.list({ sources: [session.source] })
          : [[]];

      return R.success(c, {
        debugSessionId: session.debugSessionId,
        tmbId: session.tmbId,
        source: session.source,
        status: toDebugSessionStatus(session.status, gatewayStatus),
        plugins,
        gateway: gatewayStatus
          ? {
              sessionId: gatewayStatus.session?.id,
              ownerAlive: gatewayStatus.ownerAlive,
              mailboxLag: gatewayStatus.mailboxLag
            }
          : undefined,
        expiresAt: session.expiresAt
      });
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.Revoke.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginDebugSessionRevokeRequestDTOSchema
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Revoke.response[200]!
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: PluginDebugSessionContract.Revoke.response[404]!
            }
          }
        }
      }
    }),
    async (c) => {
      const body = c.req.valid('json');
      const debugSessionId = requiredParam(c.req.param('debugSessionId'));
      const session = await deps.pluginDebugSessionRepo.revoke({
        tmbId: body.tmbId,
        debugSessionId
      });

      if (session?.gatewaySessionId) {
        await deleteGatewaySession(session.gatewaySessionId).catch((error) => {
          logger.warn('Delete revoked gateway session failed', {
            debugSessionId,
            gatewaySessionId: session.gatewaySessionId,
            error
          });
        });
      }

      return R.success(c, { revoked: Boolean(session) });
    }
  );

  return route;
};

async function createGatewaySession(input: { token: string; source: string }) {
  const response = await fetch(`${gatewayBaseUrl()}/internal/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: input.token,
      transport: 'tcp',
      metadata: {
        pluginDebug: {
          targets: []
        }
      }
    })
  });
  const payload = await parseGatewayResponse(response);
  return z
    .object({
      data: z.object({
        session: ConnectionGatewaySessionSchema
      })
    })
    .parse(payload).data.session;
}

async function getGatewayStatusBySource(source: string): Promise<GatewayStatusView> {
  const response = await fetch(
    `${gatewayBaseUrl()}/internal/sessions/by-source/${encodeURIComponent(source)}/status`,
    {
      headers: {
        Authorization: `Bearer ${serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN}`
      }
    }
  );
  const payload = await parseGatewayResponse(response);
  return GatewayStatusViewSchema.parse(payload.data);
}

async function deleteGatewaySession(sessionId: string): Promise<void> {
  const response = await fetch(`${gatewayBaseUrl()}/internal/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN}`
    }
  });

  await parseGatewayResponse(response);
}

async function parseGatewayResponse(response: Response): Promise<any> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status} ${text}`);
  }
  return payload;
}

function gatewayBaseUrl(): string {
  return serverEnv.CONNECTION_GATEWAY_BASE_URL.replace(/\/+$/, '');
}

function requiredParam(value: string | undefined): string {
  if (!value) {
    throw new Error('Required route param is missing');
  }

  return value;
}

const GatewayStatusViewSchema = z.object({
  session: z
    .object({
      id: z.string(),
      status: z.string()
    })
    .nullable(),
  ownerAlive: z.boolean(),
  mailboxLag: z.number().int().nonnegative()
});

type GatewayStatusView = z.infer<typeof GatewayStatusViewSchema>;

function toDebugSessionStatus(
  sessionStatus: 'pending' | 'connected' | 'disconnected' | 'revoked' | 'expired',
  gatewayStatus: GatewayStatusView | null
) {
  if (sessionStatus === 'revoked' || sessionStatus === 'expired') {
    return sessionStatus;
  }

  if (!gatewayStatus?.session) {
    return sessionStatus === 'pending' ? 'pending' : 'disconnected';
  }

  if (gatewayStatus.session.status === 'connected' && gatewayStatus.ownerAlive) {
    return 'connected';
  }

  return 'disconnected';
}
