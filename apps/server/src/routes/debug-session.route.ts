import type { PluginListItemDTOType } from '@interface-adapter/contracts/dto/plugin.dto';
import {
  PluginDebugSessionConnectionKeyExchangeRequestDTOSchema,
  PluginDebugSessionCreateRequestDTOSchema,
  PluginDebugSessionRevokeRequestDTOSchema
} from '@interface-adapter/contracts/dto/plugin-debug-session.dto';
import { PluginDebugSessionContract } from '@interface-adapter/contracts/route/plugin-debug-session.contract';
import z from 'zod';

import type { PluginDebugSessionPort } from '@domain/ports/plugin/plugin-debug-session.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginDebugSession } from '@domain/value-objects/plugin-debug-session.vo';
import { HmacConnectionGatewayToken } from '@infrastructure/connection-gateway/token';
import { serverEnv } from '@infrastructure/env';
import { createOpenAPIHono, createRoute, R } from '@infrastructure/hono/utils/response';
import { getLogger, mod } from '@infrastructure/logger';

export type DebugSessionRouteDeps = {
  pluginDebugSessionRepo: PluginDebugSessionPort;
  pluginRepo: PluginRepoPort;
};

const gatewayTokenSigner = new HmacConnectionGatewayToken(serverEnv.JWT_SECRET);
const gatewayTokenTtlMs = 5 * 60_000;

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
        200: jsonResponse(PluginDebugSessionContract.Create.response[200]!),
        400: jsonResponse(PluginDebugSessionContract.Create.response[400]!)
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const { session, connectionKey } = await deps.pluginDebugSessionRepo.create({
          tmbId: body.tmbId
        });

        return R.success(c, toDebugChannelResponse(session, connectionKey));
      } catch (error) {
        logger.error('Create debug channel failed', { error });
        return R.fail(c, 400, error instanceof Error ? error : String(error));
      }
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.RefreshKey.meta,
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
        200: jsonResponse(PluginDebugSessionContract.RefreshKey.response[200]!),
        400: jsonResponse(PluginDebugSessionContract.RefreshKey.response[400]!)
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const { session, connectionKey } = await deps.pluginDebugSessionRepo.refresh({
          tmbId: body.tmbId
        });

        await closeGatewaySessionBySource(session.source).catch((error) => {
          logger.warn('Close refreshed debug gateway session failed', {
            tmbId: session.tmbId,
            source: session.source,
            error
          });
        });

        return R.success(c, toDebugChannelResponse(session, connectionKey));
      } catch (error) {
        logger.error('Refresh debug channel key failed', { error });
        return R.fail(c, 400, error instanceof Error ? error : String(error));
      }
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.ExchangeConnectionKey.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginDebugSessionConnectionKeyExchangeRequestDTOSchema
            }
          }
        }
      },
      responses: {
        200: jsonResponse(PluginDebugSessionContract.ExchangeConnectionKey.response[200]!),
        400: jsonResponse(PluginDebugSessionContract.ExchangeConnectionKey.response[400]!),
        404: jsonResponse(PluginDebugSessionContract.ExchangeConnectionKey.response[404]!)
      }
    }),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const { session } = await deps.pluginDebugSessionRepo.exchangeConnectionKey(body.connectionKey);
        const expiresAt = Date.now() + gatewayTokenTtlMs;
        const connectToken = await gatewayTokenSigner.sign({
          consumerType: 'plugin-debug',
          subject: session.tmbId,
          sessionScope: {
            userId: session.tmbId,
            source: session.source
          },
          transport: 'websocket',
          capabilities: ['gateway.bind', 'invoke'],
          issuedAt: Date.now(),
          expiresAt
        });

        return R.success(c, {
          gatewayUrl: serverEnv.CONNECTION_GATEWAY_PUBLIC_URL,
          transport: 'websocket',
          source: session.source,
          connectToken,
          fastgptBaseUrl: serverEnv.FASTGPT_BASE_URL,
          expiresAt
        });
      } catch (error) {
        logger.error('Exchange debug channel connection key failed', { error });
        return R.fail(c, 404, error instanceof Error ? error : String(error));
      }
    }
  );

  route.openapi(
    createRoute({
      ...PluginDebugSessionContract.Status.meta,
      responses: {
        200: jsonResponse(PluginDebugSessionContract.Status.response[200]!),
        404: jsonResponse(PluginDebugSessionContract.Status.response[404]!)
      }
    }),
    async (c) => {
      const tmbId = requiredParam(c.req.param('tmbId'));
      const session = await deps.pluginDebugSessionRepo.get({ tmbId });
      if (!session) {
        return R.fail(c, 404, 'Debug channel not found');
      }

      const gatewayStatus = await getGatewayStatusBySource(session.source).catch(() => null);
      const plugins =
        gatewayStatus?.session && gatewayStatus.ownerAlive
          ? await listDebugPlugins(deps.pluginRepo, session.source, logger)
          : [];

      return R.success(c, toDebugChannelStatusResponse(session, gatewayStatus, plugins));
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
        200: jsonResponse(PluginDebugSessionContract.Revoke.response[200]!),
        400: jsonResponse(PluginDebugSessionContract.Revoke.response[400]!),
        404: jsonResponse(PluginDebugSessionContract.Revoke.response[404]!)
      }
    }),
    async (c) => {
      const tmbId = requiredParam(c.req.param('tmbId'));
      const body = c.req.valid('json');
      if (body.tmbId !== tmbId) {
        return R.fail(c, 400, 'Debug channel tmbId mismatch');
      }

      const session = await deps.pluginDebugSessionRepo.revoke({
        tmbId
      });

      if (session) {
        await closeGatewaySessionBySource(session.source).catch((error) => {
          logger.warn('Close revoked debug gateway session failed', {
            tmbId,
            source: session.source,
            error
          });
        });
      }

      return R.success(c, { revoked: Boolean(session) });
    }
  );

  return route;
};

function toDebugChannelResponse(session: PluginDebugSession, connectionKey?: string) {
  return {
    tmbId: session.tmbId,
    source: session.source,
    status: session.status,
    enabled: session.enabled,
    keyId: session.keyId,
    ...(connectionKey
      ? {
          connectionKey
        }
      : {}),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function toDebugChannelStatusResponse(
  session: PluginDebugSession,
  gatewayStatus: GatewayStatusView | null,
  plugins: PluginListItemDTOType[]
) {
  return {
    tmbId: session.tmbId,
    source: session.source,
    status: toDebugSessionStatus(session, gatewayStatus),
    enabled: session.enabled,
    keyId: session.enabled ? session.keyId : undefined,
    plugins,
    gateway: gatewayStatus
      ? {
          sessionId: gatewayStatus.session?.id,
          ownerAlive: gatewayStatus.ownerAlive,
          mailboxLag: gatewayStatus.mailboxLag
        }
      : undefined,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    refreshedAt: session.refreshedAt,
    revokedAt: session.revokedAt
  };
}

async function listDebugPlugins(
  pluginRepo: PluginRepoPort,
  source: string,
  logger: ReturnType<typeof getLogger>
): Promise<PluginListItemDTOType[]> {
  const [plugins, error] = await pluginRepo.list({ sources: [source] });
  if (error) {
    logger.warn('List debug channel plugins failed', { source, error });
    return [];
  }

  return plugins;
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

async function closeGatewaySessionBySource(source: string): Promise<void> {
  const gatewayStatus = await getGatewayStatusBySource(source).catch(() => null);
  if (gatewayStatus?.session) {
    await deleteGatewaySession(gatewayStatus.session.id);
  }
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
  session: PluginDebugSession,
  gatewayStatus: GatewayStatusView | null
) {
  if (!session.enabled || session.status === 'revoked') {
    return 'revoked';
  }

  if (gatewayStatus?.session?.status === 'connected' && gatewayStatus.ownerAlive) {
    return 'connected';
  }

  if (session.status === 'disconnected') {
    return 'disconnected';
  }

  return 'enabled';
}

function jsonResponse(schema: z.ZodType) {
  return {
    description: 'JSON response',
    content: {
      'application/json': {
        schema
      }
    }
  };
}
