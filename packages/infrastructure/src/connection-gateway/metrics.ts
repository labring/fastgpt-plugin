import type { ConnectionGatewayMetricsPort } from '@domain/ports/connection-gateway/metrics.port';
import type {
  ConnectionGatewayMetrics,
  ConnectionGatewayResourceLimits
} from '@domain/value-objects/connection-gateway.vo';

export class InMemoryConnectionGatewayMetrics implements ConnectionGatewayMetricsPort {
  private activeConnections = 0;
  private activeSessions = 0;
  private inFlightRequests = 0;
  private streamBufferBytes = 0;
  private slowConsumers = 0;
  private ownerLeaseExpiries = 0;
  private mailboxLag = 0;
  private redisRoundTripMs = 0;

  constructor(
    private readonly nodeId: string,
    private readonly limits: ConnectionGatewayResourceLimits
  ) {}

  snapshot(): ConnectionGatewayMetrics {
    return {
      nodeId: this.nodeId,
      activeConnections: this.activeConnections,
      activeSessions: this.activeSessions,
      inFlightRequests: this.inFlightRequests,
      streamBufferBytes: this.streamBufferBytes,
      slowConsumers: this.slowConsumers,
      ownerLeaseExpiries: this.ownerLeaseExpiries,
      mailbox: {
        lag: this.mailboxLag,
        redisRoundTripMs: this.redisRoundTripMs
      },
      limits: {
        maxConnections: this.limits.maxConnections,
        maxSessionsPerSubject: this.limits.maxSessionsPerSubject,
        maxInFlightPerSession: this.limits.maxInFlightPerSession,
        maxEnvelopeBytes: this.limits.maxEnvelopeBytes
      }
    };
  }

  recordConnectionOpened(): void {
    this.activeConnections += 1;
  }

  recordConnectionClosed(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  recordSessionOpened(): void {
    this.activeSessions += 1;
  }

  recordSessionClosed(): void {
    this.activeSessions = Math.max(0, this.activeSessions - 1);
  }

  recordRequestStarted(): void {
    this.inFlightRequests += 1;
  }

  recordRequestCompleted(): void {
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
  }

  recordStreamBufferBytes(bytes: number): void {
    this.streamBufferBytes = Math.max(0, bytes);
  }

  recordSlowConsumer(): void {
    this.slowConsumers += 1;
  }

  recordOwnerLeaseExpiry(): void {
    this.ownerLeaseExpiries += 1;
  }

  recordMailboxLag(lag: number): void {
    this.mailboxLag = Math.max(0, lag);
  }

  recordRedisRoundTrip(durationMs: number): void {
    this.redisRoundTripMs = Math.max(0, durationMs);
  }
}
