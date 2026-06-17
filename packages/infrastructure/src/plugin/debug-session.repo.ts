import { createHmac, randomBytes, randomUUID } from 'node:crypto';

import type Redis from 'ioredis';

import type {
  CreatePluginDebugSessionInput,
  CreatePluginDebugSessionOutput,
  ExchangePluginDebugSessionConnectKeyOutput,
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
  private readonly connectKeys = new Map<string, string>();
  private readonly activeByTmbId = new Map<string, string>();

  constructor(private readonly hashSecret = 'test-secret') {}

  async create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const now = input.now ?? Date.now();
    const debugSessionId = randomUUID();
    const connectKey = createOpaqueConnectKey();
    const session: PluginDebugSession = {
      debugSessionId,
      tmbId: input.tmbId,
      source: makePluginDebugSessionSource({ tmbId: input.tmbId, debugSessionId }),
      status: 'pending',
      connectKeyHash: hashConnectKey(connectKey, this.hashSecret),
      createdAt: now,
      expiresAt: now + input.ttlMs
    };
    const activeSession = await this.getActive(input.tmbId, now);
    const revokedSession = activeSession
      ? await this.revoke({
          tmbId: activeSession.tmbId,
          debugSessionId: activeSession.debugSessionId,
          now
        })
      : null;

    this.sessions.set(this.sessionKey(session), session);
    this.connectKeys.set(session.connectKeyHash, this.sessionKey(session));
    this.activeByTmbId.set(session.tmbId, session.debugSessionId);

    return {
      session,
      connectKey,
      ...(revokedSession ? { revokedSession } : {})
    };
  }

  async exchangeConnectKey(
    connectKey: string,
    now = Date.now()
  ): Promise<ExchangePluginDebugSessionConnectKeyOutput> {
    const connectKeyHash = hashConnectKey(connectKey, this.hashSecret);
    const sessionKey = this.connectKeys.get(connectKeyHash);
    if (!sessionKey) {
      throw new Error('Debug session connect key not found');
    }

    const session = this.sessions.get(sessionKey);
    if (!session || session.expiresAt <= now || session.status === 'revoked') {
      throw new Error('Debug session connect key expired');
    }

    return { session };
  }

  async get(input: {
    tmbId: string;
    debugSessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    const session = this.sessions.get(this.sessionKey(input));
    if (!session) {
      return null;
    }

    return normalizeSessionExpiry(session, input.now ?? Date.now());
  }

  async revoke(input: {
    tmbId: string;
    debugSessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    const session = this.sessions.get(this.sessionKey(input));
    if (!session) {
      return null;
    }

    const now = input.now ?? Date.now();
    const next: PluginDebugSession = {
      ...session,
      status: 'revoked',
      revokedAt: session.revokedAt ?? now
    };
    this.sessions.set(this.sessionKey(next), next);
    this.connectKeys.delete(next.connectKeyHash);
    if (this.activeByTmbId.get(next.tmbId) === next.debugSessionId) {
      this.activeByTmbId.delete(next.tmbId);
    }
    return next;
  }

  async setGatewaySession(input: {
    tmbId: string;
    debugSessionId: string;
    gatewaySessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    const session = await this.get(input);
    if (!session) {
      return null;
    }

    const next: PluginDebugSession = {
      ...session,
      gatewaySessionId: input.gatewaySessionId
    };
    this.sessions.set(this.sessionKey(next), next);
    return next;
  }

  private async getActive(tmbId: string, now: number): Promise<PluginDebugSession | null> {
    const debugSessionId = this.activeByTmbId.get(tmbId);
    if (!debugSessionId) {
      return null;
    }

    return this.get({ tmbId, debugSessionId, now });
  }

  private sessionKey(input: { tmbId: string; debugSessionId: string }): string {
    return `${input.tmbId}:${input.debugSessionId}`;
  }
}

export class RedisPluginDebugSessionRepo implements PluginDebugSessionPort {
  constructor(
    private readonly redis: Redis,
    private readonly hashSecret: string
  ) {}

  async create(input: CreatePluginDebugSessionInput): Promise<CreatePluginDebugSessionOutput> {
    const now = input.now ?? Date.now();
    const debugSessionId = randomUUID();
    const connectKey = createOpaqueConnectKey();
    const session: PluginDebugSession = {
      debugSessionId,
      tmbId: input.tmbId,
      source: makePluginDebugSessionSource({ tmbId: input.tmbId, debugSessionId }),
      status: 'pending',
      connectKeyHash: hashConnectKey(connectKey, this.hashSecret),
      createdAt: now,
      expiresAt: now + input.ttlMs
    };
    const activeSession = await this.getActive(input.tmbId, now);
    const revokedSession = activeSession
      ? await this.revoke({
          tmbId: activeSession.tmbId,
          debugSessionId: activeSession.debugSessionId,
          now
        })
      : null;

    await this.saveSession(session);
    await this.redis
      .multi()
      .set(
        this.connectKeyRedisKey(session.connectKeyHash),
        this.sessionKey(session),
        'PX',
        input.connectKeyTtlMs
      )
      .set(this.activeKey(session.tmbId), session.debugSessionId, 'PX', input.ttlMs)
      .exec();

    return {
      session,
      connectKey,
      ...(revokedSession ? { revokedSession } : {})
    };
  }

  async exchangeConnectKey(
    connectKey: string,
    now = Date.now()
  ): Promise<ExchangePluginDebugSessionConnectKeyOutput> {
    const connectKeyHash = hashConnectKey(connectKey, this.hashSecret);
    const connectKeyRedisKey = this.connectKeyRedisKey(connectKeyHash);
    const sessionKey = await this.redis.get(connectKeyRedisKey);
    if (!sessionKey) {
      throw new Error('Debug session connect key not found');
    }

    const session = await this.getByKey(String(sessionKey), now);
    if (!session || session.status === 'revoked') {
      throw new Error('Debug session connect key expired');
    }

    return { session };
  }

  async get(input: {
    tmbId: string;
    debugSessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    return this.getByKey(this.sessionKey(input), input.now ?? Date.now());
  }

  async revoke(input: {
    tmbId: string;
    debugSessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    const session = await this.get(input);
    if (!session) {
      return null;
    }

    const now = input.now ?? Date.now();
    const next: PluginDebugSession = {
      ...session,
      status: 'revoked',
      revokedAt: session.revokedAt ?? now
    };
    await this.saveSession(next);

    const multi = this.redis.multi().del(this.connectKeyRedisKey(next.connectKeyHash));
    if ((await this.redis.get(this.activeKey(next.tmbId))) === next.debugSessionId) {
      multi.del(this.activeKey(next.tmbId));
    }
    await multi.exec();

    return next;
  }

  async setGatewaySession(input: {
    tmbId: string;
    debugSessionId: string;
    gatewaySessionId: string;
    now?: number;
  }): Promise<PluginDebugSession | null> {
    const session = await this.get(input);
    if (!session) {
      return null;
    }

    const next: PluginDebugSession = {
      ...session,
      gatewaySessionId: input.gatewaySessionId
    };
    await this.saveSession(next);
    return next;
  }

  private async getActive(tmbId: string, now: number): Promise<PluginDebugSession | null> {
    const debugSessionId = await this.redis.get(this.activeKey(tmbId));
    if (!debugSessionId) {
      return null;
    }

    return this.get({ tmbId, debugSessionId, now });
  }

  private async getByKey(key: string, now: number): Promise<PluginDebugSession | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }

    const session = PluginDebugSessionSchema.parse(JSON.parse(value));
    return normalizeSessionExpiry(session, now);
  }

  private async saveSession(session: PluginDebugSession): Promise<void> {
    await this.redis.set(
      this.sessionKey(session),
      JSON.stringify(session),
      'PX',
      Math.max(1, session.expiresAt - Date.now())
    );
  }

  private sessionKey(input: { tmbId: string; debugSessionId: string }): string {
    return `${KEY_PREFIX}:by-id:${input.tmbId}:${input.debugSessionId}`;
  }

  private connectKeyRedisKey(connectKeyHash: string): string {
    return `${KEY_PREFIX}:by-connect-key:${connectKeyHash}`;
  }

  private activeKey(tmbId: string): string {
    return `${KEY_PREFIX}:active-by-tmb:${tmbId}`;
  }
}

function normalizeSessionExpiry(
  session: PluginDebugSession,
  now: number
): PluginDebugSession | null {
  if (session.expiresAt > now) {
    return session;
  }

  return {
    ...session,
    status: session.status === 'revoked' ? 'revoked' : 'expired'
  };
}

function createOpaqueConnectKey(): string {
  return randomBytes(32).toString('base64url');
}

function hashConnectKey(connectKey: string, secret: string): string {
  return createHmac('sha256', secret).update(connectKey).digest('base64url');
}
