import { describe, expect, it, vi } from 'vitest';

import { InMemoryPluginDebugSessionRepo, RedisPluginDebugSessionRepo } from './debug-session.repo';

describe('InMemoryPluginDebugSessionRepo', () => {
  it('enables one tmbId scoped debug channel and reuses its connection key', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const now = Date.now();
    const { session, connectionKey } = await repo.create({
      tmbId: 'tmb-1',
      now
    });

    expect(session).toMatchObject({
      tmbId: 'tmb-1',
      source: 'debug:tmbId:tmb-1',
      status: 'enabled',
      enabled: true
    });
    await expect(repo.exchangeConnectionKey(connectionKey!, now + 1)).resolves.toEqual({ session });
    await expect(repo.exchangeConnectionKey(connectionKey!, now + 2)).resolves.toEqual({ session });
  });

  it('does not rotate the connection key when enabling an already enabled channel', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const first = await repo.create({
      tmbId: 'tmb-1',
      now: 1_000
    });
    const second = await repo.create({
      tmbId: 'tmb-1',
      now: 2_000
    });

    expect(second.connectionKey).toBeUndefined();
    expect(second.session.keyId).toBe(first.session.keyId);
    await expect(repo.exchangeConnectionKey(first.connectionKey!, 2_001)).resolves.toMatchObject({
      session: {
        keyId: first.session.keyId
      }
    });
  });

  it('refreshes the connection key and disables the old key', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const first = await repo.create({
      tmbId: 'tmb-1',
      now: 1_000
    });
    const second = await repo.refresh({
      tmbId: 'tmb-1',
      now: 2_000
    });

    expect(second.connectionKey).not.toBe(first.connectionKey);
    expect(second.session.keyId).not.toBe(first.session.keyId);
    await expect(repo.exchangeConnectionKey(first.connectionKey!, 2_001)).rejects.toThrow(
      'Debug connection key not found'
    );
    await expect(repo.exchangeConnectionKey(second.connectionKey!, 2_001)).resolves.toMatchObject({
      session: {
        keyId: second.session.keyId
      }
    });
  });

  it('disconnects the debug session and keeps the connection key reusable', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const created = await repo.create({
      tmbId: 'tmb-1',
      now: 1_000
    });

    await expect(repo.revoke({ tmbId: 'tmb-1', now: 2_000 })).resolves.toMatchObject({
      enabled: true,
      status: 'disconnected'
    });

    await expect(repo.exchangeConnectionKey(created.connectionKey!, 2_001)).resolves.toMatchObject({
      session: {
        keyId: created.session.keyId,
        status: 'disconnected'
      }
    });

    const enabledAgain = await repo.create({
      tmbId: 'tmb-1',
      now: 3_000
    });

    expect(enabledAgain.connectionKey).toBe(created.connectionKey);
    expect(enabledAgain.session.keyId).toBe(created.session.keyId);
    await expect(repo.exchangeConnectionKey(created.connectionKey!, 3_001)).resolves.toMatchObject({
      session: {
        keyId: created.session.keyId,
        status: 'enabled'
      }
    });
  });
});

describe('RedisPluginDebugSessionRepo', () => {
  it('clears legacy sessions without connectionKeyHash and allows recreating the channel', async () => {
    const redis = makeRedisStub();
    const repo = new RedisPluginDebugSessionRepo(redis as never, 'secret');
    const sessionKey = 'plugin-debug:sessions:by-tmb:tmb-legacy';
    redis.store.set(
      sessionKey,
      JSON.stringify({
        tmbId: 'tmb-legacy',
        source: 'debug:tmbId:tmb-legacy',
        status: 'enabled',
        enabled: true,
        keyId: 'legacy-key-id',
        createdAt: 1_000,
        updatedAt: 1_000
      })
    );

    await expect(repo.get({ tmbId: 'tmb-legacy' })).resolves.toBeNull();
    expect(redis.store.has(sessionKey)).toBe(false);

    const recreated = await repo.create({ tmbId: 'tmb-legacy', now: 2_000 });
    expect(recreated.connectionKey).toBeTruthy();
    expect(recreated.session).toMatchObject({
      tmbId: 'tmb-legacy',
      source: 'debug:tmbId:tmb-legacy',
      enabled: true,
      status: 'enabled',
      createdAt: 2_000,
      updatedAt: 2_000
    });
    expect(recreated.session.connectionKeyHash).toBeTruthy();
  });

  it('rejects stale connection key mappings after key rotation', async () => {
    const redis = makeRedisStub();
    const repo = new RedisPluginDebugSessionRepo(redis as never, 'secret');
    const created = await repo.create({ tmbId: 'tmb-1', now: 1_000 });
    const rotated = await repo.refresh({ tmbId: 'tmb-1', now: 2_000 });

    redis.store.set(`plugin-debug:sessions:by-connection-key:${created.session.connectionKeyHash}`, 'tmb-1');

    await expect(repo.exchangeConnectionKey(created.connectionKey!, 2_001)).rejects.toThrow(
      'Debug connection key disabled'
    );
    await expect(repo.exchangeConnectionKey(rotated.connectionKey!, 2_001)).resolves.toMatchObject({
      session: {
        keyId: rotated.session.keyId
      }
    });
  });

  it('disconnects the debug session without rotating the connection key', async () => {
    const redis = makeRedisStub();
    const repo = new RedisPluginDebugSessionRepo(redis as never, 'secret');
    const created = await repo.create({ tmbId: 'tmb-1', now: 1_000 });

    await expect(repo.revoke({ tmbId: 'tmb-1', now: 2_000 })).resolves.toMatchObject({
      enabled: true,
      status: 'disconnected'
    });
    await expect(repo.exchangeConnectionKey(created.connectionKey!, 2_001)).resolves.toMatchObject({
      session: {
        keyId: created.session.keyId,
        status: 'disconnected'
      }
    });

    const enabledAgain = await repo.create({ tmbId: 'tmb-1', now: 3_000 });

    expect(enabledAgain.connectionKey).toBe(created.connectionKey);
    expect(enabledAgain.session.keyId).toBe(created.session.keyId);
    await expect(repo.exchangeConnectionKey(created.connectionKey!, 3_001)).resolves.toMatchObject({
      session: {
        keyId: created.session.keyId,
        status: 'enabled'
      }
    });
  });

  it('backfills legacy session connection keys after a successful exchange', async () => {
    const redis = makeRedisStub();
    const repo = new RedisPluginDebugSessionRepo(redis as never, 'secret');
    const created = await repo.create({ tmbId: 'tmb-1', now: 1_000 });

    redis.store.set(
      'plugin-debug:sessions:by-tmb:tmb-1',
      JSON.stringify({
        ...created.session,
        connectionKey: undefined
      })
    );

    await expect(repo.exchangeConnectionKey(created.connectionKey!, 1_500)).resolves.toMatchObject({
      session: {
        connectionKey: created.connectionKey
      }
    });
    await repo.revoke({ tmbId: 'tmb-1', now: 2_000 });

    const enabledAgain = await repo.create({ tmbId: 'tmb-1', now: 3_000 });

    expect(enabledAgain.connectionKey).toBe(created.connectionKey);
  });
});

function makeRedisStub() {
  const store = new Map<string, string>();

  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      keys.forEach((key) => store.delete(key));
      return keys.length;
    }),
    multi: vi.fn(() => {
      const commands: Array<() => void> = [];
      const multi = {
        set: vi.fn((key: string, value: string) => {
          commands.push(() => store.set(key, value));
          return multi;
        }),
        del: vi.fn((key: string) => {
          commands.push(() => store.delete(key));
          return multi;
        }),
        exec: vi.fn(async () => {
          commands.forEach((command) => command());
          return [];
        })
      };

      return multi;
    })
  };
}
