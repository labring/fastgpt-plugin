import type { ConnectionGatewayResourceLimits } from '@domain/value-objects/connection-gateway.vo';
import { createError } from '@domain/value-objects/error.vo';

import { ErrorCode } from '../errors/error.registry';

export class ConnectionGatewayResourceLimiter {
  private activeConnections = 0;
  private readonly inFlightBySession = new Map<string, number>();

  constructor(readonly limits: ConnectionGatewayResourceLimits) {}

  acquireConnection(): void {
    if (this.activeConnections >= this.limits.maxConnections) {
      throw createError(ErrorCode.connectionGatewayResourceLimitExceeded, {
        data: { limit: 'maxConnections', max: this.limits.maxConnections }
      });
    }
    this.activeConnections += 1;
  }

  releaseConnection(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  assertSessionBudget(subject: string, activeSessions: number): void {
    if (activeSessions >= this.limits.maxSessionsPerSubject) {
      throw createError(ErrorCode.connectionGatewayResourceLimitExceeded, {
        data: {
          limit: 'maxSessionsPerSubject',
          subject,
          max: this.limits.maxSessionsPerSubject
        }
      });
    }
  }

  acquireInFlight(sessionId: string): void {
    const current = this.inFlightBySession.get(sessionId) ?? 0;
    if (current >= this.limits.maxInFlightPerSession) {
      throw createError(ErrorCode.connectionGatewayResourceLimitExceeded, {
        data: {
          limit: 'maxInFlightPerSession',
          sessionId,
          max: this.limits.maxInFlightPerSession
        }
      });
    }

    this.inFlightBySession.set(sessionId, current + 1);
  }

  releaseInFlight(sessionId: string): void {
    const current = this.inFlightBySession.get(sessionId) ?? 0;
    if (current <= 1) {
      this.inFlightBySession.delete(sessionId);
      return;
    }

    this.inFlightBySession.set(sessionId, current - 1);
  }

  assertEnvelopeBytes(value: unknown): number {
    const bytes = Buffer.byteLength(JSON.stringify(value), 'utf8');

    if (bytes > this.limits.maxEnvelopeBytes) {
      throw createError(ErrorCode.connectionGatewayEnvelopeTooLarge, {
        data: {
          max: this.limits.maxEnvelopeBytes,
          actual: bytes
        }
      });
    }

    return bytes;
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }

  getInFlightRequests(): number {
    let count = 0;
    for (const value of this.inFlightBySession.values()) {
      count += value;
    }
    return count;
  }
}
