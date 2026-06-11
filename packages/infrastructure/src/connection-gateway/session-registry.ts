import type Redis from 'ioredis';

import type {
  ConnectionGatewaySessionRegistryPort,
  CreateConnectionGatewaySessionInput,
  RenewConnectionGatewayOwnerLeaseInput
} from '@domain/ports/connection-gateway/session-registry.port';
import {
  type ConnectionGatewaySession,
  ConnectionGatewaySessionSchema,
  type ConnectionGatewaySessionStatus
} from '@domain/value-objects/connection-gateway.vo';

const SESSION_KEY_PREFIX = 'connection-gateway:sessions';

export class InMemoryConnectionGatewaySessionRegistry
  implements ConnectionGatewaySessionRegistryPort
{
  private readonly sessions = new Map<string, ConnectionGatewaySession>();

  async create(input: CreateConnectionGatewaySessionInput): Promise<ConnectionGatewaySession> {
    const now = input.now ?? Date.now();
    const existing = this.sessions.get(input.id);
    const session: ConnectionGatewaySession = {
      ...input,
      generation: input.generation ?? (existing ? existing.generation + 1 : 0),
      status: input.status ?? 'connected',
      connectedAt: now,
      lastSeenAt: now
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async get(sessionId: string): Promise<ConnectionGatewaySession | null> {
    this.dropExpired(Date.now());
    return this.sessions.get(sessionId) ?? null;
  }

  async listBySubject(subject: string): Promise<ConnectionGatewaySession[]> {
    this.dropExpired(Date.now());
    return [...this.sessions.values()].filter((session) => session.subject === subject);
  }

  async renewOwnerLease(input: RenewConnectionGatewayOwnerLeaseInput): Promise<boolean> {
    const session = await this.get(input.sessionId);
    if (!session || session.ownerNodeId !== input.ownerNodeId) {
      return false;
    }

    this.sessions.set(session.id, {
      ...session,
      expiresAt: input.expiresAt,
      lastSeenAt: input.now ?? Date.now()
    });
    return true;
  }

  async updateStatus(input: {
    sessionId: string;
    ownerNodeId: string;
    status: ConnectionGatewaySessionStatus;
    now?: number;
  }): Promise<boolean> {
    const session = await this.get(input.sessionId);
    if (!session || session.ownerNodeId !== input.ownerNodeId) {
      return false;
    }

    this.sessions.set(session.id, {
      ...session,
      status: input.status,
      lastSeenAt: input.now ?? Date.now()
    });
    return true;
  }

  async remove(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async countActive(): Promise<number> {
    this.dropExpired(Date.now());
    return this.sessions.size;
  }

  private dropExpired(now: number): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export class RedisConnectionGatewaySessionRegistry implements ConnectionGatewaySessionRegistryPort {
  constructor(
    private readonly redis: Redis,
    private readonly ttlMs: number
  ) {}

  async create(input: CreateConnectionGatewaySessionInput): Promise<ConnectionGatewaySession> {
    const now = input.now ?? Date.now();
    const existing = await this.get(input.id);
    const session: ConnectionGatewaySession = {
      ...input,
      generation: input.generation ?? (existing ? existing.generation + 1 : 0),
      status: input.status ?? 'connected',
      connectedAt: now,
      lastSeenAt: now
    };

    await this.redis
      .multi()
      .set(this.sessionKey(session.id), JSON.stringify(session), 'PX', this.ttlMs)
      .sadd(this.subjectKey(session.subject), session.id)
      .pexpire(this.subjectKey(session.subject), this.ttlMs)
      .exec();

    return session;
  }

  async get(sessionId: string): Promise<ConnectionGatewaySession | null> {
    const value = await this.redis.get(this.sessionKey(sessionId));
    if (!value) {
      return null;
    }

    const parsed = ConnectionGatewaySessionSchema.parse(JSON.parse(value));
    if (parsed.expiresAt <= Date.now()) {
      await this.redis
        .multi()
        .del(this.sessionKey(sessionId))
        .srem(this.subjectKey(parsed.subject), sessionId)
        .exec();
      return null;
    }

    return parsed;
  }

  async listBySubject(subject: string): Promise<ConnectionGatewaySession[]> {
    const sessionIds = await this.redis.smembers(this.subjectKey(subject));
    const sessions = await Promise.all(sessionIds.map((sessionId) => this.get(sessionId)));

    return sessions.filter((session): session is ConnectionGatewaySession => session !== null);
  }

  async renewOwnerLease(input: RenewConnectionGatewayOwnerLeaseInput): Promise<boolean> {
    const session = await this.get(input.sessionId);
    if (!session || session.ownerNodeId !== input.ownerNodeId) {
      return false;
    }

    const next: ConnectionGatewaySession = {
      ...session,
      expiresAt: input.expiresAt,
      lastSeenAt: input.now ?? Date.now()
    };
    await this.redis.set(this.sessionKey(session.id), JSON.stringify(next), 'PX', this.ttlMs);
    return true;
  }

  async updateStatus(input: {
    sessionId: string;
    ownerNodeId: string;
    status: ConnectionGatewaySessionStatus;
    now?: number;
  }): Promise<boolean> {
    const session = await this.get(input.sessionId);
    if (!session || session.ownerNodeId !== input.ownerNodeId) {
      return false;
    }

    const next: ConnectionGatewaySession = {
      ...session,
      status: input.status,
      lastSeenAt: input.now ?? Date.now()
    };
    await this.redis.set(this.sessionKey(session.id), JSON.stringify(next), 'PX', this.ttlMs);
    return true;
  }

  async remove(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    const multi = this.redis.multi().del(this.sessionKey(sessionId));

    if (session) {
      multi.srem(this.subjectKey(session.subject), sessionId);
    }

    await multi.exec();
  }

  async countActive(): Promise<number> {
    const keys = await this.redis.keys(`${SESSION_KEY_PREFIX}:by-id:*`);
    return keys.length;
  }

  private sessionKey(sessionId: string): string {
    return `${SESSION_KEY_PREFIX}:by-id:${sessionId}`;
  }

  private subjectKey(subject: string): string {
    return `${SESSION_KEY_PREFIX}:by-subject:${subject}`;
  }
}
