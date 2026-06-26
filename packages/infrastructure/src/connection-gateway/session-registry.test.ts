import '@infrastructure/errors/error.registry';

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

  it('rejects a second active session on the same source and allows rebinding after close', async () => {
    const now = Date.now();
    const redis = makeRedisStub();
    const registry = new RedisConnectionGatewaySessionRegistry(redis as never, 60_000);
    await registry.create({
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

    await expect(
      registry.create({
        id: 'session-b',
        consumerType: 'plugin-debug',
        subject: 'user:u1',
        sessionScope: {
          userId: 'u1',
          source: 'debug:user:u1'
        },
        transport: 'websocket',
        capabilities: ['invoke'],
        ownerNodeId: 'node-b',
        expiresAt: now + 15_000,
        metadata: {},
        now: now + 1
      })
    ).rejects.toMatchObject({
      code: 'connection_gateway.session_already_bound',
      data: {
        source: 'debug:user:u1',
        sessionId: 'session-a'
      }
    });

    await expect(
      registry.updateStatus({
        sessionId: 'session-a',
        ownerNodeId: 'node-a',
        status: 'closed',
        now: now + 2
      })
    ).resolves.toBe(true);

    await expect(
      registry.create({
        id: 'session-c',
        consumerType: 'plugin-debug',
        subject: 'user:u1',
        sessionScope: {
          userId: 'u1',
          source: 'debug:user:u1'
        },
        transport: 'websocket',
        capabilities: ['invoke'],
        ownerNodeId: 'node-c',
        expiresAt: now + 15_000,
        metadata: {},
        now: now + 3
      })
    ).resolves.toMatchObject({
      id: 'session-c'
    });
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
    eval: async (script: string, numKeys: number, ...args: string[]) => {
      const keys = args.slice(0, numKeys);
      const valuesArgs = args.slice(numKeys);

      if (script.includes('connection-gateway:source-owner:upsert')) {
        const ttl = Number(valuesArgs[0]);
        const sessionId = valuesArgs[1];
        for (const key of keys) {
          const owner = values.get(key);
          if (owner && owner !== sessionId) {
            return [0, key, owner];
          }
        }
        for (const key of keys) {
          redis.ops.push(['set', key, sessionId, 'PX', ttl]);
          values.set(key, sessionId);
        }
        return [1];
      }

      if (script.includes('connection-gateway:source-owner:release')) {
        const sessionId = valuesArgs[0];
        for (const key of keys) {
          if (values.get(key) === sessionId) {
            redis.ops.push(['del', key]);
            values.delete(key);
          }
        }
        return [1];
      }

      throw new Error(`Unsupported eval script: ${script}`);
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
