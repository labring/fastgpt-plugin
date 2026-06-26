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
import { createError } from '@domain/value-objects/error.vo';

import { ErrorCode } from '../errors/error.registry';

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

    assertNoActiveSourceConflict(this.sessions.values(), session, now);
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

  async listBySource(source: string): Promise<ConnectionGatewaySession[]> {
    this.dropExpired(Date.now());
    return [...this.sessions.values()].filter((session) =>
      getSessionSources(session).includes(source)
    );
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

  async updateMetadata(input: {
    sessionId: string;
    metadata: Record<string, unknown>;
    now?: number;
  }): Promise<ConnectionGatewaySession | null> {
    const session = await this.get(input.sessionId);
    if (!session) {
      return null;
    }

    const next: ConnectionGatewaySession = {
      ...session,
      metadata: input.metadata,
      lastSeenAt: input.now ?? Date.now()
    };
    this.sessions.set(session.id, next);
    return next;
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

    await this.claimSourceOwners(session, now);
    try {
      await this.saveSessionAndIndexes(session);
    } catch (error) {
      await this.releaseSourceOwners(session).catch(() => undefined);
      throw error;
    }

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
      await this.removeSourceIndexes(parsed, sessionId);
      await this.releaseSourceOwners(parsed);
      return null;
    }

    return parsed;
  }

  async listBySubject(subject: string): Promise<ConnectionGatewaySession[]> {
    const sessionIds = await this.redis.smembers(this.subjectKey(subject));
    const sessions = await Promise.all(sessionIds.map((sessionId) => this.get(sessionId)));

    return sessions.filter((session): session is ConnectionGatewaySession => session !== null);
  }

  async listBySource(source: string): Promise<ConnectionGatewaySession[]> {
    const sessionIds = await this.redis.smembers(this.sourceKey(source));
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
    if (!(await this.refreshSourceOwners(next, input.now ?? Date.now()))) {
      return false;
    }
    await this.saveSessionAndIndexes(next);
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
    await this.saveSessionAndIndexes(next);
    if (next.status === 'connected') {
      if (!(await this.refreshSourceOwners(next, input.now ?? Date.now()))) {
        return false;
      }
    } else {
      await this.releaseSourceOwners(next);
    }
    return true;
  }

  async updateMetadata(input: {
    sessionId: string;
    metadata: Record<string, unknown>;
    now?: number;
  }): Promise<ConnectionGatewaySession | null> {
    const session = await this.get(input.sessionId);
    if (!session) {
      return null;
    }

    const next: ConnectionGatewaySession = {
      ...session,
      metadata: input.metadata,
      lastSeenAt: input.now ?? Date.now()
    };
    await this.saveSessionAndIndexes(next);
    return next;
  }

  async remove(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    const multi = this.redis.multi().del(this.sessionKey(sessionId));

    if (session) {
      multi.srem(this.subjectKey(session.subject), sessionId);
      for (const source of getSessionSources(session)) {
        multi.srem(this.sourceKey(source), sessionId);
      }
    }

    await multi.exec();
    if (session) {
      await this.releaseSourceOwners(session);
    }
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

  private sourceKey(source: string): string {
    return `${SESSION_KEY_PREFIX}:by-source:${source}`;
  }

  private sourceOwnerKey(source: string): string {
    return `${SESSION_KEY_PREFIX}:source-owner:${source}`;
  }

  private async saveSessionAndIndexes(session: ConnectionGatewaySession): Promise<void> {
    const multi = this.redis
      .multi()
      .set(this.sessionKey(session.id), JSON.stringify(session), 'PX', this.ttlMs)
      .sadd(this.subjectKey(session.subject), session.id)
      .pexpire(this.subjectKey(session.subject), this.ttlMs);

    for (const source of getSessionSources(session)) {
      multi.sadd(this.sourceKey(source), session.id);
      multi.pexpire(this.sourceKey(source), this.ttlMs);
    }

    await multi.exec();
  }

  private async removeSourceIndexes(
    session: ConnectionGatewaySession,
    sessionId: string
  ): Promise<void> {
    const sources = getSessionSources(session);
    if (sources.length === 0) {
      return;
    }

    const multi = this.redis.multi();
    for (const source of sources) {
      multi.srem(this.sourceKey(source), sessionId);
    }
    await multi.exec();
  }

  private async claimSourceOwners(session: ConnectionGatewaySession, now: number): Promise<void> {
    const sources = getSessionSources(session);
    if (sources.length === 0) {
      return;
    }

    const ttlMs = getOwnerLeaseTtlMs(session, now);
    const keys = sources.map((source) => this.sourceOwnerKey(source));
    const result = (await this.redis.eval(
      UPSERT_SOURCE_OWNER_SCRIPT,
      keys.length,
      ...keys,
      String(ttlMs),
      session.id
    )) as [number, string?, string?];

    if (result[0] === 1) {
      return;
    }

    const conflictKey = result[1];
    const conflictOwner = result[2];
    const source = conflictKey ? this.sourceFromOwnerKey(conflictKey) : sources[0];
    throw createError(ErrorCode.connectionGatewaySessionAlreadyBound, {
      data: {
        source,
        sessionId: conflictOwner
      }
    });
  }

  private async refreshSourceOwners(
    session: ConnectionGatewaySession,
    now: number
  ): Promise<boolean> {
    const sources = getSessionSources(session);
    if (sources.length === 0) {
      return true;
    }

    const ttlMs = getOwnerLeaseTtlMs(session, now);
    const keys = sources.map((source) => this.sourceOwnerKey(source));
    const result = (await this.redis.eval(
      UPSERT_SOURCE_OWNER_SCRIPT,
      keys.length,
      ...keys,
      String(ttlMs),
      session.id
    )) as [number];

    return result[0] === 1;
  }

  private async releaseSourceOwners(session: ConnectionGatewaySession): Promise<void> {
    const sources = getSessionSources(session);
    if (sources.length === 0) {
      return;
    }

    const keys = sources.map((source) => this.sourceOwnerKey(source));
    await this.redis.eval(RELEASE_SOURCE_OWNER_SCRIPT, keys.length, ...keys, session.id);
  }

  private sourceFromOwnerKey(key: string): string {
    return key.replace(`${SESSION_KEY_PREFIX}:source-owner:`, '');
  }
}

function getSessionSources(session: ConnectionGatewaySession): string[] {
  return [
    ...(session.sessionScope.source ? [session.sessionScope.source] : []),
    ...(session.sessionScope.sources ?? [])
  ].filter((source, index, sources) => sources.indexOf(source) === index);
}

function getOwnerLeaseTtlMs(session: ConnectionGatewaySession, now: number): number {
  return Math.max(1, session.expiresAt - now);
}

function assertNoActiveSourceConflict(
  sessions: Iterable<ConnectionGatewaySession>,
  nextSession: ConnectionGatewaySession,
  now: number
): void {
  const nextSources = getSessionSources(nextSession);
  if (nextSources.length === 0) {
    return;
  }

  const activeSession = [...sessions].find((session) => {
    if (session.id === nextSession.id) {
      return false;
    }
    if (session.status !== 'connected' || session.expiresAt <= now) {
      return false;
    }

    const sources = getSessionSources(session);
    return nextSources.some((source) => sources.includes(source));
  });

  if (!activeSession) {
    return;
  }

  const source = nextSources.find((item) => getSessionSources(activeSession).includes(item));
  throw createError(ErrorCode.connectionGatewaySessionAlreadyBound, {
    data: {
      source,
      sessionId: activeSession.id,
      subject: activeSession.subject
    }
  });
}

const UPSERT_SOURCE_OWNER_SCRIPT = `
-- connection-gateway:source-owner:upsert
local ttl = tonumber(ARGV[1])
local sessionId = ARGV[2]
for i = 1, #KEYS do
  local owner = redis.call('GET', KEYS[i])
  if owner and owner ~= sessionId then
    return {0, KEYS[i], owner}
  end
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], sessionId, 'PX', ttl)
end
return {1}
`;

const RELEASE_SOURCE_OWNER_SCRIPT = `
-- connection-gateway:source-owner:release
local sessionId = ARGV[1]
for i = 1, #KEYS do
  local owner = redis.call('GET', KEYS[i])
  if owner == sessionId then
    redis.call('DEL', KEYS[i])
  end
end
return {1}
`;
