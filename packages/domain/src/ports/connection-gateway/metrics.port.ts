import type { ConnectionGatewayMetrics } from '@domain/value-objects/connection-gateway.vo';

export interface ConnectionGatewayMetricsPort {
  snapshot(): ConnectionGatewayMetrics;
  recordConnectionOpened(): void;
  recordConnectionClosed(): void;
  recordSessionOpened(): void;
  recordSessionClosed(): void;
  recordRequestStarted(sessionId: string): void;
  recordRequestCompleted(sessionId: string): void;
  recordStreamBufferBytes(bytes: number): void;
  recordSlowConsumer(): void;
  recordOwnerLeaseExpiry(): void;
  recordMailboxLag(lag: number): void;
  recordRedisRoundTrip(durationMs: number): void;
}
