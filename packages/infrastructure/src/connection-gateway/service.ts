import { randomUUID } from 'node:crypto';

import type { ConnectionGatewayMailboxPort } from '@domain/ports/connection-gateway/mailbox.port';
import type { ConnectionGatewayMetricsPort } from '@domain/ports/connection-gateway/metrics.port';
import type { ConnectionGatewaySessionRegistryPort } from '@domain/ports/connection-gateway/session-registry.port';
import type { ConnectionGatewayTokenVerifierPort } from '@domain/ports/connection-gateway/connection-token.port';
import {
  type ConnectionGatewayEnvelope,
  ConnectionGatewayEnvelopeSchema,
  type ConnectionGatewaySession,
  type ConnectionGatewaySessionStatusView,
  type ConnectionGatewayTransport
} from '@domain/value-objects/connection-gateway.vo';
import { createError } from '@domain/value-objects/error.vo';

import { ErrorCode } from '../errors/error.registry';

import { ConnectionGatewayResourceLimiter } from './resource-limiter';

type GatewayLogEntry = ConnectionGatewaySessionStatusView['logs'][number];

export type ConnectionGatewayServiceOptions = {
  nodeId: string;
  sessionTtlMs: number;
  ownerLeaseTtlMs: number;
  mailboxMaxLen: number;
};

export type ConnectionGatewayServiceDeps = {
  tokenVerifier: ConnectionGatewayTokenVerifierPort;
  sessionRegistry: ConnectionGatewaySessionRegistryPort;
  mailbox: ConnectionGatewayMailboxPort;
  metrics: ConnectionGatewayMetricsPort;
  limiter: ConnectionGatewayResourceLimiter;
  options: ConnectionGatewayServiceOptions;
};

export class ConnectionGatewayService {
  private readonly logs = new Map<string, GatewayLogEntry[]>();

  constructor(private readonly deps: ConnectionGatewayServiceDeps) {}

  metrics() {
    return this.deps.metrics.snapshot();
  }

  async createSession(input: {
    token: string;
    transport: ConnectionGatewayTransport;
    now?: number;
  }): Promise<ConnectionGatewaySession> {
    const now = input.now ?? Date.now();
    const claims = await this.deps.tokenVerifier.verify({
      token: input.token,
      expectedTransport: input.transport,
      now
    });
    const sessions = await this.deps.sessionRegistry.listBySubject(claims.subject);
    this.deps.limiter.assertSessionBudget(claims.subject, sessions.length);

    const expiresAt = now + this.deps.options.ownerLeaseTtlMs;
    const session = await this.deps.sessionRegistry.create({
      id: randomUUID(),
      consumerType: claims.consumerType,
      subject: claims.subject,
      sessionScope: claims.sessionScope,
      transport: claims.transport,
      capabilities: claims.capabilities,
      ownerNodeId: this.deps.options.nodeId,
      expiresAt,
      now
    });

    await this.deps.mailbox.expire(session.id, this.deps.options.sessionTtlMs);
    this.deps.metrics.recordSessionOpened();
    this.pushLog(session.id, 'info', 'Gateway session connected', {
      consumerType: session.consumerType,
      subject: session.subject,
      transport: session.transport,
      generation: session.generation
    });

    return session;
  }

  async getStatus(sessionId: string): Promise<ConnectionGatewaySessionStatusView> {
    const session = await this.deps.sessionRegistry.get(sessionId);
    const mailboxLag = await this.deps.mailbox.lag(sessionId);
    this.deps.metrics.recordMailboxLag(mailboxLag);

    return {
      session,
      ownerAlive: Boolean(session && session.expiresAt > Date.now()),
      mailboxLag,
      logs: this.logs.get(sessionId) ?? []
    };
  }

  async publishRequest(input: {
    sessionId: string;
    envelope: ConnectionGatewayEnvelope;
  }): Promise<{ messageId: string; accepted: true }> {
    const envelope = ConnectionGatewayEnvelopeSchema.parse(input.envelope);
    this.deps.limiter.assertEnvelopeBytes(envelope);

    const session = await this.deps.sessionRegistry.get(input.sessionId);
    if (!session) {
      throw createError(ErrorCode.connectionGatewaySessionNotFound);
    }

    if (session.expiresAt <= Date.now()) {
      this.deps.metrics.recordOwnerLeaseExpiry();
      throw createError(ErrorCode.connectionGatewaySessionOwnerExpired);
    }

    if (envelope.generation !== session.generation) {
      throw createError(ErrorCode.connectionGatewayStaleGeneration, {
        data: {
          expectedGeneration: session.generation,
          actualGeneration: envelope.generation
        }
      });
    }

    if (envelope.consumerType !== session.consumerType) {
      throw createError(ErrorCode.connectionGatewayInvalidToken, {
        data: {
          expectedConsumerType: session.consumerType,
          actualConsumerType: envelope.consumerType
        }
      });
    }

    if (envelope.capability && !session.capabilities.includes(envelope.capability)) {
      throw createError(ErrorCode.connectionGatewayCapabilityDenied, {
        data: { capability: envelope.capability }
      });
    }

    this.deps.limiter.acquireInFlight(session.id);
    this.deps.metrics.recordRequestStarted(session.id);

    try {
      const messageId = await this.deps.mailbox.publish(session.id, envelope);
      await this.deps.mailbox.trim(session.id, this.deps.options.mailboxMaxLen);
      await this.deps.mailbox.expire(session.id, this.deps.options.sessionTtlMs);
      const lag = await this.deps.mailbox.lag(session.id);
      this.deps.metrics.recordMailboxLag(lag);
      this.pushLog(session.id, 'debug', 'Gateway envelope published', {
        messageId,
        type: envelope.type,
        requestId: envelope.requestId
      });

      return { messageId, accepted: true };
    } finally {
      this.deps.metrics.recordRequestCompleted(session.id);
      this.deps.limiter.releaseInFlight(session.id);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.deps.sessionRegistry.get(sessionId);
    await this.deps.sessionRegistry.remove(sessionId);
    if (session) {
      this.deps.metrics.recordSessionClosed();
      this.pushLog(sessionId, 'info', 'Gateway session deleted');
    }
  }

  async renewOwnerLease(sessionId: string, now = Date.now()): Promise<boolean> {
    const renewed = await this.deps.sessionRegistry.renewOwnerLease({
      sessionId,
      ownerNodeId: this.deps.options.nodeId,
      expiresAt: now + this.deps.options.ownerLeaseTtlMs,
      now
    });

    if (renewed) {
      this.pushLog(sessionId, 'debug', 'Gateway owner lease renewed');
    }

    return renewed;
  }

  private pushLog(
    sessionId: string,
    level: GatewayLogEntry['level'],
    message: string,
    data?: GatewayLogEntry['data']
  ): void {
    const logs = this.logs.get(sessionId) ?? [];
    logs.push({
      ts: Date.now(),
      level,
      message,
      ...(data ? { data } : {})
    });
    this.logs.set(sessionId, logs.slice(-100));
  }
}
