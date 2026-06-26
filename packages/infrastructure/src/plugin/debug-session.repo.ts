import { createHmac, randomBytes, randomUUID } from 'node:crypto';

import type Redis from 'ioredis';

import type {
  CreatePluginDebugSessionInput,
  CreatePluginDebugSessionOutput,
  ExchangePluginDebugSessionConnectionKeyOutput,
  PluginDebugSessionPort
} from '@domain/ports/plugin/plugin-debug-session.port';
import {
  makePluginDebugSessionSource,
  type PluginDebugSession,
  PluginDebugSessionSchema
} from '@domain/value-objects/plugin-debug-session.vo';

const KEY_PREFIX = 'plugin-debug:sessions';

export class InMemoryPluginDebugSessionRepo implements PluginDebugSessionPort {
  private readonly sessions = new Map<string, PluginDebugSession>();
  private readonly connectionKeys = new Map<string, string>();

  constructor(private readonly hashSecret = 'test-secret') {}

  async create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const existing = await this.get({ tmbId: input.tmbId });
    if (existing?.enabled) {
      if (existing.status === 'disconnected') {
        const session = await this.markEnabled(existing, input.now);
        return { session, connectionKey: session.connectionKey };
      }
      return { session: existing };
    }

    return this.writeEnabledSession(input, existing ?? undefined);
  }

  async refresh(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const existing = await this.get({ tmbId: input.tmbId });
    return this.writeEnabledSession(input, existing ?? undefined);
  }

  async exchangeConnectionKey(
    connectionKey: string,
    _now = Date.now()
  ): Promise<ExchangePluginDebugSessionConnectionKeyOutput> {
    const connectionKeyHash = hashConnectionKey(connectionKey, this.hashSecret);
    const tmbId = this.connectionKeys.get(connectionKeyHash);
    if (!tmbId) {
      throw new Error('Debug connection key not found');
    }

    const session = this.sessions.get(this.sessionKey({ tmbId }));
    if (
      !session ||
      !session.enabled ||
      session.connectionKeyHash !== connectionKeyHash
    ) {
      throw new Error('Debug connection key disabled');
    }

    return { session: await this.ensureConnectionKeyStored(session, connectionKey) };
  }

  async get(input: { tmbId: string; now?: number }): Promise<PluginDebugSession | null> {
    return this.sessions.get(this.sessionKey(input)) ?? null;
  }

  async revoke(input: { tmbId: string; now?: number }): Promise<PluginDebugSession | null> {
    const session = await this.get(input);
    if (!session) {
      return null;
    }

    const now = input.now ?? Date.now();
    const next: PluginDebugSession = {
      ...session,
      status: 'disconnected',
      updatedAt: now,
      revokedAt: session.revokedAt ?? now
    };
    this.sessions.set(this.sessionKey(next), next);
    return next;
  }

  private async markEnabled(
    session: PluginDebugSession,
    now = Date.now()
  ): Promise<PluginDebugSession> {
    const next: PluginDebugSession = {
      ...session,
      status: 'enabled',
      updatedAt: now,
      revokedAt: undefined
    };
    this.sessions.set(this.sessionKey(next), next);
    return next;
  }

  private async ensureConnectionKeyStored(
    session: PluginDebugSession,
    connectionKey: string
  ): Promise<PluginDebugSession> {
    if (session.connectionKey) {
      return session;
    }

    const next = {
      ...session,
      connectionKey
    };
    this.sessions.set(this.sessionKey(next), next);
    return next;
  }

  private async writeEnabledSession(
    input: CreatePluginDebugSessionInput,
    existing?: PluginDebugSession
  ): Promise<CreatePluginDebugSessionOutput> {
    const now = input.now ?? Date.now();
    const connectionKey = createOpaqueConnectionKey();
    const session: PluginDebugSession = {
      tmbId: input.tmbId,
      source: makePluginDebugSessionSource({ tmbId: input.tmbId }),
      status: 'enabled',
      enabled: true,
      keyId: randomUUID(),
      connectionKeyHash: hashConnectionKey(connectionKey, this.hashSecret),
      connectionKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      refreshedAt: existing ? now : undefined
    };

    if (existing) {
      this.connectionKeys.delete(existing.connectionKeyHash);
    }
    this.sessions.set(this.sessionKey(session), session);
    this.connectionKeys.set(session.connectionKeyHash, session.tmbId);

    return { session, connectionKey };
  }

  private sessionKey(input: { tmbId: string }): string {
    return input.tmbId;
  }
}

export class RedisPluginDebugSessionRepo implements PluginDebugSessionPort {
  constructor(
    private readonly redis: Redis,
    private readonly hashSecret: string
  ) {}

  async create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const existing = await this.get({ tmbId: input.tmbId });
    if (existing?.enabled) {
      if (existing.status === 'disconnected') {
        const session = await this.markEnabled(existing, input.now);
        return { session, connectionKey: session.connectionKey };
      }
      return { session: existing };
    }

    return this.writeEnabledSession(input, existing ?? undefined);
  }

  async refresh(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const existing = await this.get({ tmbId: input.tmbId });
    return this.writeEnabledSession(input, existing ?? undefined);
  }

  async exchangeConnectionKey(
    connectionKey: string,
    _now = Date.now()
  ): Promise<ExchangePluginDebugSessionConnectionKeyOutput> {
    const connectionKeyHash = hashConnectionKey(connectionKey, this.hashSecret);
    const tmbId = await this.redis.get(this.connectionKeyRedisKey(connectionKeyHash));
    if (!tmbId) {
      throw new Error('Debug connection key not found');
    }

    const session = await this.get({ tmbId: String(tmbId) });
    if (
      !session ||
      !session.enabled ||
      session.connectionKeyHash !== connectionKeyHash
    ) {
      throw new Error('Debug connection key disabled');
    }

    return { session: await this.ensureConnectionKeyStored(session, connectionKey) };
  }

  async get(input: { tmbId: string; now?: number }): Promise<PluginDebugSession | null> {
    const sessionKey = this.sessionKey(input);
    const value = await this.redis.get(sessionKey);
    if (!value) {
      return null;
    }

    const parsed = parseStoredDebugSession(value);
    if (parsed.session) {
      return parsed.session;
    }

    await this.clearInvalidStoredSession(sessionKey, parsed.connectionKeyHash);
    return null;
  }

  async revoke(input: { tmbId: string; now?: number }): Promise<PluginDebugSession | null> {
    const session = await this.get(input);
    if (!session) {
      return null;
    }

    const now = input.now ?? Date.now();
    const next: PluginDebugSession = {
      ...session,
      status: 'disconnected',
      updatedAt: now,
      revokedAt: session.revokedAt ?? now
    };
    await this.saveSession(next);
    return next;
  }

  private async markEnabled(
    session: PluginDebugSession,
    now = Date.now()
  ): Promise<PluginDebugSession> {
    const next: PluginDebugSession = {
      ...session,
      status: 'enabled',
      updatedAt: now,
      revokedAt: undefined
    };
    await this.saveSession(next);
    return next;
  }

  private async ensureConnectionKeyStored(
    session: PluginDebugSession,
    connectionKey: string
  ): Promise<PluginDebugSession> {
    if (session.connectionKey) {
      return session;
    }

    const next = {
      ...session,
      connectionKey
    };
    await this.saveSession(next);
    return next;
  }

  private async writeEnabledSession(
    input: CreatePluginDebugSessionInput,
    existing?: PluginDebugSession
  ): Promise<CreatePluginDebugSessionOutput> {
    const now = input.now ?? Date.now();
    const connectionKey = createOpaqueConnectionKey();
    const session: PluginDebugSession = {
      tmbId: input.tmbId,
      source: makePluginDebugSessionSource({ tmbId: input.tmbId }),
      status: 'enabled',
      enabled: true,
      keyId: randomUUID(),
      connectionKeyHash: hashConnectionKey(connectionKey, this.hashSecret),
      connectionKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      refreshedAt: existing ? now : undefined
    };

    const multi = this.redis.multi().set(this.sessionKey(session), JSON.stringify(session));
    if (existing) {
      multi.del(this.connectionKeyRedisKey(existing.connectionKeyHash));
    }
    multi.set(this.connectionKeyRedisKey(session.connectionKeyHash), session.tmbId);
    await multi.exec();

    return { session, connectionKey };
  }

  private async saveSession(session: PluginDebugSession): Promise<void> {
    await this.redis.set(this.sessionKey(session), JSON.stringify(session));
  }

  private sessionKey(input: { tmbId: string }): string {
    return `${KEY_PREFIX}:by-tmb:${input.tmbId}`;
  }

  private connectionKeyRedisKey(connectionKeyHash: string): string {
    return `${KEY_PREFIX}:by-connection-key:${connectionKeyHash}`;
  }

  /**
   * 旧版 debug session 记录缺少 connectionKeyHash，不能恢复出原始连接密钥。
   * 读取失败时直接清理并视为未开启，让后续 create/refresh 生成新的安全连接密钥。
   */
  private async clearInvalidStoredSession(
    sessionKey: string,
    connectionKeyHash?: string
  ): Promise<void> {
    const keys = [sessionKey];
    if (connectionKeyHash) {
      keys.push(this.connectionKeyRedisKey(connectionKeyHash));
    }

    await this.redis.del(...keys);
  }
}

function createOpaqueConnectionKey(): string {
  return randomBytes(32).toString('base64url');
}

function hashConnectionKey(connectionKey: string, secret: string): string {
  return createHmac('sha256', secret).update(connectionKey).digest('base64url');
}

function parseStoredDebugSession(value: string): {
  session?: PluginDebugSession;
  connectionKeyHash?: string;
} {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return {};
  }

  const parsed = PluginDebugSessionSchema.safeParse(raw);
  if (parsed.success) {
    return { session: parsed.data };
  }

  const connectionKeyHash =
    raw && typeof raw === 'object'
      ? (raw as { connectionKeyHash?: unknown }).connectionKeyHash
      : undefined;

  return {
    connectionKeyHash: typeof connectionKeyHash === 'string' ? connectionKeyHash : undefined
  };
}
