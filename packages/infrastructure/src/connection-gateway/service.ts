import { randomUUID } from 'node:crypto';

import type { ConnectionGatewayTokenVerifierPort } from '@domain/ports/connection-gateway/connection-token.port';
import type { ConnectionGatewayMailboxPort } from '@domain/ports/connection-gateway/mailbox.port';
import type { ConnectionGatewayMetricsPort } from '@domain/ports/connection-gateway/metrics.port';
import type { ConnectionGatewaySessionRegistryPort } from '@domain/ports/connection-gateway/session-registry.port';
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
  mailboxBlockMs: number;
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
    metadata?: Record<string, unknown>;
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
      metadata: input.metadata,
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

  async getLatestStatusBySource(source: string): Promise<ConnectionGatewaySessionStatusView> {
    const sessions = await this.deps.sessionRegistry.listBySource(source);
    const session = sessions.sort((a, b) => b.lastSeenAt - a.lastSeenAt)[0] ?? null;

    if (!session) {
      return {
        session: null,
        ownerAlive: false,
        mailboxLag: 0,
        logs: []
      };
    }

    return this.getStatus(session.id);
  }

  async publishRequest(input: {
    sessionId: string;
    envelope: ConnectionGatewayEnvelope;
  }): Promise<{ messageId: string; accepted: true }> {
    const envelope = ConnectionGatewayEnvelopeSchema.parse(input.envelope);
    this.deps.limiter.assertEnvelopeBytes(envelope);

    const session = await this.assertEnvelopeSession(input.sessionId, envelope);

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

  async publishRequestAndWait(input: {
    sessionId: string;
    envelope: ConnectionGatewayEnvelope;
    timeoutMs?: number;
  }): Promise<{
    requestId: string;
    responses: AsyncIterable<ConnectionGatewayEnvelope>;
  }> {
    const requestId = input.envelope.requestId ?? randomUUID();
    const envelope = ConnectionGatewayEnvelopeSchema.parse({
      ...input.envelope,
      requestId
    });
    const replyMailboxId = this.getReplyMailboxId(input.sessionId, requestId);

    await this.deps.mailbox.expire(replyMailboxId, this.deps.options.sessionTtlMs);
    await this.publishRequest({
      sessionId: input.sessionId,
      envelope
    });

    return {
      requestId,
      responses: this.readReplyEnvelopes({
        sessionId: input.sessionId,
        requestId,
        timeoutMs: input.timeoutMs ?? this.deps.options.sessionTtlMs
      })
    };
  }

  async publishResponse(input: {
    sessionId: string;
    envelope: ConnectionGatewayEnvelope;
  }): Promise<{ messageId: string; accepted: true }> {
    const envelope = ConnectionGatewayEnvelopeSchema.parse(input.envelope);
    this.deps.limiter.assertEnvelopeBytes(envelope);
    await this.assertEnvelopeSession(input.sessionId, envelope);

    if (!envelope.requestId) {
      throw createError(ErrorCode.connectionGatewayInvalidToken, {
        message: 'Gateway response envelope requires requestId'
      });
    }

    const replyMailboxId = this.getReplyMailboxId(input.sessionId, envelope.requestId);
    const messageId = await this.deps.mailbox.publish(replyMailboxId, envelope);
    await this.deps.mailbox.expire(replyMailboxId, this.deps.options.sessionTtlMs);
    this.pushLog(input.sessionId, 'debug', 'Gateway response envelope published', {
      messageId,
      type: envelope.type,
      requestId: envelope.requestId
    });

    return { messageId, accepted: true };
  }

  async bindSession(input: {
    sessionId: string;
    envelope: ConnectionGatewayEnvelope;
  }): Promise<ConnectionGatewaySession> {
    const envelope = ConnectionGatewayEnvelopeSchema.parse(input.envelope);
    const session = await this.assertEnvelopeSession(input.sessionId, envelope, {
      requireCapability: false
    });

    if (envelope.type !== 'event' || envelope.capability !== 'gateway.bind') {
      throw createError(ErrorCode.connectionGatewayInvalidToken, {
        message: 'Gateway bind envelope is invalid'
      });
    }

    await this.renewOwnerLease(session.id);
    this.pushLog(session.id, 'info', 'Gateway TCP session bound', {
      consumerType: session.consumerType,
      subject: session.subject,
      transport: session.transport,
      generation: session.generation
    });

    return session;
  }

  async readSessionRequests(input: {
    sessionId: string;
    afterId?: string;
    blockMs?: number;
    count?: number;
  }) {
    return this.deps.mailbox.read({
      sessionId: input.sessionId,
      afterId: input.afterId,
      blockMs: input.blockMs ?? this.deps.options.mailboxBlockMs,
      count: input.count
    });
  }

  async ackSessionRequests(sessionId: string, messageIds: string[]): Promise<void> {
    await this.deps.mailbox.ack(sessionId, messageIds);
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

  private async assertEnvelopeSession(
    sessionId: string,
    envelope: ConnectionGatewayEnvelope,
    options: { requireCapability?: boolean } = {}
  ): Promise<ConnectionGatewaySession> {
    const session = await this.deps.sessionRegistry.get(sessionId);
    if (!session) {
      throw createError(ErrorCode.connectionGatewaySessionNotFound);
    }

    if (session.expiresAt <= Date.now()) {
      this.deps.metrics.recordOwnerLeaseExpiry();
      throw createError(ErrorCode.connectionGatewaySessionOwnerExpired);
    }

    if (envelope.sessionId !== session.id) {
      throw createError(ErrorCode.connectionGatewaySessionNotFound);
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

    if (
      options.requireCapability !== false &&
      envelope.capability &&
      !session.capabilities.includes(envelope.capability)
    ) {
      throw createError(ErrorCode.connectionGatewayCapabilityDenied, {
        data: { capability: envelope.capability }
      });
    }

    return session;
  }

  private async *readReplyEnvelopes(input: {
    sessionId: string;
    requestId: string;
    timeoutMs: number;
  }): AsyncIterable<ConnectionGatewayEnvelope> {
    const replyMailboxId = this.getReplyMailboxId(input.sessionId, input.requestId);
    const deadline = Date.now() + input.timeoutMs;
    let afterId: string | undefined = '0-0';

    while (Date.now() < deadline) {
      const remainingMs = Math.max(1, deadline - Date.now());
      const messages = await this.deps.mailbox.read({
        sessionId: replyMailboxId,
        afterId,
        blockMs: Math.min(this.deps.options.mailboxBlockMs, remainingMs),
        count: 10
      });

      if (messages.length === 0) {
        continue;
      }

      afterId = messages[messages.length - 1].id;
      await this.deps.mailbox.ack(
        replyMailboxId,
        messages.map((message) => message.id)
      );

      for (const message of messages) {
        yield message.envelope;

        if (isTerminalReplyEnvelope(message.envelope)) {
          return;
        }
      }
    }

    throw createError(ErrorCode.connectionGatewaySessionOwnerExpired, {
      message: 'Gateway request timed out waiting for response',
      data: {
        sessionId: input.sessionId,
        requestId: input.requestId,
        timeoutMs: input.timeoutMs
      }
    });
  }

  private getReplyMailboxId(sessionId: string, requestId: string): string {
    return `reply:${sessionId}:${requestId}`;
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

function isTerminalReplyEnvelope(envelope: ConnectionGatewayEnvelope): boolean {
  if (envelope.type === 'response') {
    if (!envelope.payload || typeof envelope.payload !== 'object') {
      return true;
    }

    const payload = envelope.payload as { kind?: unknown };
    return payload.kind !== 'plugin-debug.accepted';
  }

  if (envelope.type !== 'stream' || !envelope.payload || typeof envelope.payload !== 'object') {
    return false;
  }

  const payload = envelope.payload as { event?: unknown };
  return payload.event === 'end' || payload.event === 'error';
}
