import { ConnectionGatewayResourceLimitsSchema } from '@domain/value-objects/connection-gateway.vo';
import { CONNECTION_GATEWAY_BIND_CAPABILITY } from '@domain/value-objects/connection-gateway-debug.vo';
import { RedisConnectionGatewayMailbox } from '@infrastructure/connection-gateway/mailbox';
import { InMemoryConnectionGatewayMetrics } from '@infrastructure/connection-gateway/metrics';
import { ConnectionGatewayResourceLimiter } from '@infrastructure/connection-gateway/resource-limiter';
import { ConnectionGatewayService } from '@infrastructure/connection-gateway/service';
import { RedisConnectionGatewaySessionRegistry } from '@infrastructure/connection-gateway/session-registry';
import { HmacConnectionGatewayToken } from '@infrastructure/connection-gateway/token';
import { TcpConnectionGatewayTransport } from '@infrastructure/connection-gateway/transports/tcp-transport';
import type { ConnectionGatewayTransportConnection } from '@infrastructure/connection-gateway/transports/transport';
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
  const tcpTransport = new TcpConnectionGatewayTransport({
    port: gatewayEnv.CONNECTION_GATEWAY_TCP_PORT,
    maxFrameBytes: gatewayEnv.CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES,
    limiter,
    handlers: {
      onConnection: () => metrics.recordConnectionOpened(),
      onClose: (connection) => {
        metrics.recordConnectionClosed();
        const binding = boundConnections.get(connection.id);
        if (binding) {
          binding.closed = true;
          boundConnections.delete(connection.id);
          void service.closeSession(binding.sessionId, 'tcp_connection_closed').catch((error) => {
            logger.warn('Connection Gateway TCP session close status update failed', {
              connectionId: connection.id,
              sessionId: binding.sessionId,
              error
            });
          });
        }
      },
      onEnvelope: async (connection, envelope) => {
        if (envelope.type === 'event' && envelope.capability === CONNECTION_GATEWAY_BIND_CAPABILITY) {
          const session = await service.bindSession({
            sessionId: envelope.sessionId,
            envelope
          });
          const binding = { sessionId: session.id, closed: false };
          boundConnections.set(connection.id, binding);
          void pumpSessionMailbox({
            service,
            connection,
            binding,
            logger
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
        logger.warn('Connection Gateway TCP transport error', {
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
    tcpTransport,
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
        await connection.send(message.envelope);
      }

      await service.ackSessionRequests(
        binding.sessionId,
        messages.map((message) => message.id)
      );
    } catch (error) {
      logger.warn('Connection Gateway TCP mailbox pump failed', {
        connectionId: connection.id,
        sessionId: binding.sessionId,
        error
      });
      connection.close(error instanceof Error ? error : new Error(String(error)));
      return;
    }
  }
}
