import { ConnectionGatewayResourceLimitsSchema } from '@domain/value-objects/connection-gateway.vo';
import { RegisteredError } from '@domain/value-objects/error.vo';
import { RedisConnectionGatewayMailbox } from '@infrastructure/connection-gateway/mailbox';
import { InMemoryConnectionGatewayMetrics } from '@infrastructure/connection-gateway/metrics';
import { ConnectionGatewayResourceLimiter } from '@infrastructure/connection-gateway/resource-limiter';
import { ConnectionGatewayService } from '@infrastructure/connection-gateway/service';
import { RedisConnectionGatewaySessionRegistry } from '@infrastructure/connection-gateway/session-registry';
import { HmacConnectionGatewayToken } from '@infrastructure/connection-gateway/token';
import type { ConnectionGatewayTransportConnection } from '@infrastructure/connection-gateway/transports/transport';
import { WebSocketConnectionGatewayTransport } from '@infrastructure/connection-gateway/transports/websocket-transport';
import { gatewayEnv } from '@infrastructure/env';
import { getLogger, root } from '@infrastructure/logger';
import { getServiceInstanceId, registerConnectionGatewayGaugeSource } from '@infrastructure/metrics';
import { RedisClient } from '@infrastructure/redis/redis-client';

export function makeConnectionGatewayDeps() {
  const logger = getLogger(root);
  const redisClient = RedisClient.create({ redisUrl: gatewayEnv.REDIS_URL });
  const nodeId = gatewayEnv.CONNECTION_GATEWAY_NODE_ID ?? getServiceInstanceId();
  const limits = ConnectionGatewayResourceLimitsSchema.parse({
    maxConnections: gatewayEnv.CONNECTION_GATEWAY_MAX_CONNECTIONS,
    maxSessionsPerSubject: gatewayEnv.CONNECTION_GATEWAY_MAX_SESSIONS_PER_SUBJECT,
    maxInFlightPerSession: gatewayEnv.CONNECTION_GATEWAY_MAX_IN_FLIGHT_PER_SESSION,
    maxEnvelopeBytes: gatewayEnv.CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES,
    slowConsumerBufferBytes: gatewayEnv.CONNECTION_GATEWAY_SLOW_CONSUMER_BUFFER_BYTES
  });
  const metrics = new InMemoryConnectionGatewayMetrics(nodeId, limits);
  const unregisterMetrics = registerConnectionGatewayGaugeSource({
    getConnectionGatewayMetrics: () => metrics.snapshot()
  });
  const limiter = new ConnectionGatewayResourceLimiter(limits);
  const tokenVerifier = new HmacConnectionGatewayToken(gatewayEnv.JWT_SECRET);
  const sessionRegistry = new RedisConnectionGatewaySessionRegistry(
    redisClient.getClient,
    gatewayEnv.CONNECTION_GATEWAY_SESSION_TTL_MS
  );
  const mailbox = new RedisConnectionGatewayMailbox(redisClient.getClient, {
    maxLen: gatewayEnv.CONNECTION_GATEWAY_MAILBOX_MAXLEN,
    metrics
  });
  const service = new ConnectionGatewayService({
    tokenVerifier,
    sessionRegistry,
    mailbox,
    metrics,
    limiter,
    options: {
      nodeId,
      sessionTtlMs: gatewayEnv.CONNECTION_GATEWAY_SESSION_TTL_MS,
      ownerLeaseTtlMs: gatewayEnv.CONNECTION_GATEWAY_OWNER_LEASE_TTL_MS,
      mailboxBlockMs: gatewayEnv.CONNECTION_GATEWAY_MAILBOX_BLOCK_MS,
      mailboxMaxLen: gatewayEnv.CONNECTION_GATEWAY_MAILBOX_MAXLEN
    }
  });
  const boundConnections = new Map<string, { sessionId: string; closed: boolean }>();
  const disconnectSession = (sessionId: string, reason?: Error): boolean => {
    for (const [connectionId, binding] of boundConnections.entries()) {
      if (binding.sessionId !== sessionId || binding.closed) {
        continue;
      }

      binding.closed = true;
      boundConnections.delete(connectionId);
      connectionById.get(connectionId)?.close(reason);
      return true;
    }

    return false;
  };
  const connectionById = new Map<string, ConnectionGatewayTransportConnection>();
  const websocketTransport = new WebSocketConnectionGatewayTransport({
    path: gatewayEnv.CONNECTION_GATEWAY_WS_PATH,
    maxFrameBytes: gatewayEnv.CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES,
    limiter,
    handlers: {
      onConnection: () => metrics.recordConnectionOpened(),
      onClose: (connection) => {
        connectionById.delete(connection.id);
        metrics.recordConnectionClosed();
        const binding = boundConnections.get(connection.id);
        if (binding) {
          binding.closed = true;
          boundConnections.delete(connection.id);
          void service.closeSession(binding.sessionId, 'websocket_connection_closed').catch((error) => {
            logger.warn('Connection Gateway WebSocket session close status update failed', {
              connectionId: connection.id,
              sessionId: binding.sessionId,
              error
            });
          });
        }
      },
      onMessage: async (connection, message) => {
        if (message.type === 'bind') {
          try {
            connectionById.set(connection.id, connection);
            const session = await service.bindConnection({
              token: message.token,
              metadata: message.metadata
            });
            const binding = { sessionId: session.id, closed: false };
            boundConnections.set(connection.id, binding);
            await connection.send({
              protocol: 'connection-gateway.ws.v1',
              type: 'bound',
              requestId: message.requestId,
              session
            });
            void pumpSessionMailbox({
              service,
              connection,
              binding,
              logger
            });
          } catch (error) {
            const normalized = error instanceof Error ? error : new Error(String(error));
            await connection.send({
              protocol: 'connection-gateway.ws.v1',
              type: 'error',
              requestId: message.requestId,
              code:
                error instanceof RegisteredError
                  ? error.code
                  : 'connection_gateway.bind_failed',
              message: normalized.message
            });
            connection.close(normalized);
          }
          return;
        }

        if (message.type === 'heartbeat') {
          await connection.send({
            protocol: 'connection-gateway.ws.v1',
            type: 'heartbeat',
            ts: Date.now()
          });
          return;
        }

        const binding = boundConnections.get(connection.id);
        if (!binding || binding.closed) {
          await connection.send({
            protocol: 'connection-gateway.ws.v1',
            type: 'error',
            requestId: message.envelope.requestId,
            code: 'connection_gateway.unbound',
            message: 'Gateway WebSocket connection is not bound'
          });
          return;
        }

        const envelope = message.envelope;
        if (envelope.sessionId !== binding.sessionId) {
          await connection.send({
            protocol: 'connection-gateway.ws.v1',
            type: 'error',
            requestId: envelope.requestId,
            code: 'connection_gateway.session_mismatch',
            message: 'Gateway envelope session does not match bound connection'
          });
          return;
        }

        if (envelope.type === 'request') {
          await service.publishRequest({
            sessionId: envelope.sessionId,
            envelope
          });
          return;
        }

        await service.publishResponse({
          sessionId: envelope.sessionId,
          envelope
        });
      },
      onError: (connection, error) => {
        logger.warn('Connection Gateway WebSocket transport error', {
          connectionId: connection?.id,
          remoteAddress: connection?.remoteAddress,
          error
        });
      }
    }
  });

  return {
    redisClient,
    mailbox,
    service,
    disconnectSession,
    websocketTransport,
    metrics,
    limiter,
    unregisterMetrics
  };
}

export type ConnectionGatewayDeps = ReturnType<typeof makeConnectionGatewayDeps>;

async function pumpSessionMailbox({
  service,
  connection,
  binding,
  logger
}: {
  service: ConnectionGatewayService;
  connection: ConnectionGatewayTransportConnection;
  binding: { sessionId: string; closed: boolean };
  logger: ReturnType<typeof getLogger>;
}) {
  let afterId: string | undefined = '0-0';

  while (!binding.closed) {
    try {
      await service.renewOwnerLease(binding.sessionId);
      const messages = await service.readSessionRequests({
        sessionId: binding.sessionId,
        afterId,
        count: 10
      });

      if (messages.length === 0) {
        continue;
      }

      afterId = messages[messages.length - 1].id;

      for (const message of messages) {
        await connection.send({
          protocol: 'connection-gateway.ws.v1',
          type: 'envelope',
          envelope: message.envelope
        });
      }

      await service.ackSessionRequests(
        binding.sessionId,
        messages.map((message) => message.id)
      );
    } catch (error) {
      logger.warn('Connection Gateway WebSocket mailbox pump failed', {
        connectionId: connection.id,
        sessionId: binding.sessionId,
        error
      });
      connection.close(error instanceof Error ? error : new Error(String(error)));
      return;
    }
  }
}
