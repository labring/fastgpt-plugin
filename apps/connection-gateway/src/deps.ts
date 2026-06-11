import { ConnectionGatewayResourceLimitsSchema } from '@domain/value-objects/connection-gateway.vo';
import { HmacConnectionGatewayToken } from '@infrastructure/connection-gateway/token';
import { RedisConnectionGatewayMailbox } from '@infrastructure/connection-gateway/mailbox';
import { InMemoryConnectionGatewayMetrics } from '@infrastructure/connection-gateway/metrics';
import { ConnectionGatewayResourceLimiter } from '@infrastructure/connection-gateway/resource-limiter';
import { ConnectionGatewayService } from '@infrastructure/connection-gateway/service';
import { RedisConnectionGatewaySessionRegistry } from '@infrastructure/connection-gateway/session-registry';
import { TcpConnectionGatewayTransport } from '@infrastructure/connection-gateway/transports/tcp-transport';
import { env } from '@infrastructure/env';
import { getLogger, root } from '@infrastructure/logger';
import { getServiceInstanceId } from '@infrastructure/metrics';
import { RedisClient } from '@infrastructure/redis/redis-client';

export function makeConnectionGatewayDeps() {
  const logger = getLogger(root);
  const redisClient = RedisClient.getInstance();
  const nodeId = env.CONNECTION_GATEWAY_NODE_ID ?? getServiceInstanceId();
  const limits = ConnectionGatewayResourceLimitsSchema.parse({
    maxConnections: env.CONNECTION_GATEWAY_MAX_CONNECTIONS,
    maxSessionsPerSubject: env.CONNECTION_GATEWAY_MAX_SESSIONS_PER_SUBJECT,
    maxInFlightPerSession: env.CONNECTION_GATEWAY_MAX_IN_FLIGHT_PER_SESSION,
    maxEnvelopeBytes: env.CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES,
    slowConsumerBufferBytes: env.CONNECTION_GATEWAY_SLOW_CONSUMER_BUFFER_BYTES
  });
  const metrics = new InMemoryConnectionGatewayMetrics(nodeId, limits);
  const limiter = new ConnectionGatewayResourceLimiter(limits);
  const tokenVerifier = new HmacConnectionGatewayToken(env.JWT_SECRET);
  const sessionRegistry = new RedisConnectionGatewaySessionRegistry(
    redisClient.getClient,
    env.CONNECTION_GATEWAY_SESSION_TTL_MS
  );
  const mailbox = new RedisConnectionGatewayMailbox(redisClient.getClient, {
    maxLen: env.CONNECTION_GATEWAY_MAILBOX_MAXLEN,
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
      sessionTtlMs: env.CONNECTION_GATEWAY_SESSION_TTL_MS,
      ownerLeaseTtlMs: env.CONNECTION_GATEWAY_OWNER_LEASE_TTL_MS,
      mailboxMaxLen: env.CONNECTION_GATEWAY_MAILBOX_MAXLEN
    }
  });
  const tcpTransport = new TcpConnectionGatewayTransport({
    port: env.CONNECTION_GATEWAY_TCP_PORT,
    maxFrameBytes: env.CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES,
    limiter,
    handlers: {
      onConnection: () => metrics.recordConnectionOpened(),
      onClose: () => metrics.recordConnectionClosed(),
      onEnvelope: async (_connection, envelope) => {
        await service.publishRequest({
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
    service,
    tcpTransport,
    metrics,
    limiter
  };
}

export type ConnectionGatewayDeps = ReturnType<typeof makeConnectionGatewayDeps>;
