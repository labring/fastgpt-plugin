import { describe, expect, it } from 'vitest';

import { RedisConnectionGatewaySessionRegistry } from './session-registry';

describe('RedisConnectionGatewaySessionRegistry', () => {
  it('renews subject and source index TTLs with the owner lease', async () => {
    const now = Date.now();
    const redis = makeRedisStub();
    const registry = new RedisConnectionGatewaySessionRegistry(redis as never, 60_000);
    const session = await registry.create({
      id: 'session-a',
      consumerType: 'plugin-debug',
      subject: 'user:u1',
      sessionScope: {
        userId: 'u1',
        source: 'debug:user:u1'
      },
      transport: 'websocket',
      capabilities: ['invoke'],
      ownerNodeId: 'node-a',
      expiresAt: now + 15_000,
      metadata: {},
      now
    });

    redis.ops.length = 0;

    await expect(
      registry.renewOwnerLease({
        sessionId: session.id,
        ownerNodeId: 'node-a',
        expiresAt: now + 30_000,
        now: now + 5_000
      })
    ).resolves.toBe(true);

    expect(redis.ops).toContainEqual([
      'pexpire',
      'connection-gateway:sessions:by-subject:user:u1',
      60_000
    ]);
    expect(redis.ops).toContainEqual([
      'pexpire',
      'connection-gateway:sessions:by-source:debug:user:u1',
      60_000
    ]);
    await expect(registry.listBySource('debug:user:u1')).resolves.toEqual([
      expect.objectContaining({
        id: session.id,
        expiresAt: now + 30_000,
        lastSeenAt: now + 5_000
      })
    ]);
  });
});

function makeRedisStub() {
  const values = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const redis = {
    ops: [] as unknown[][],
    get: async (key: string) => values.get(key) ?? null,
    smembers: async (key: string) => [...(sets.get(key) ?? new Set<string>())],
    keys: async (pattern: string) => {
      const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;

      return [...values.keys()].filter((key) => key.startsWith(prefix));
    },
    multi: () => {
      const multi = {
        set: (key: string, value: string, mode: string, ttl: number) => {
          redis.ops.push(['set', key, value, mode, ttl]);
          values.set(key, value);
          return multi;
        },
        sadd: (key: string, value: string) => {
          redis.ops.push(['sadd', key, value]);
          const set = sets.get(key) ?? new Set<string>();
          set.add(value);
          sets.set(key, set);
          return multi;
        },
        pexpire: (key: string, ttl: number) => {
          redis.ops.push(['pexpire', key, ttl]);
          return multi;
        },
        del: (key: string) => {
          redis.ops.push(['del', key]);
          values.delete(key);
          return multi;
        },
        srem: (key: string, value: string) => {
          redis.ops.push(['srem', key, value]);
          sets.get(key)?.delete(value);
          return multi;
        },
        exec: async () => []
      };

      return multi;
    }
  };

  return redis;
}
