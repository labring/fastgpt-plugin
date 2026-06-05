import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VersionKeyStore } from './version-key';

const redisStore = new Map<string, string>();
const redisClient = {
  getClient: {
    get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, mode?: string) => {
      if (mode === 'NX' && redisStore.has(key)) {
        return null;
      }
      redisStore.set(key, value);
      return 'OK';
    })
  }
};

describe('VersionKeyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisStore.clear();
  });

  it('creates a shared Redis version key only once and syncs later stores locally', async () => {
    const first = new VersionKeyStore({ redisClient: redisClient as any }, 'runtime');
    const second = new VersionKeyStore({ redisClient: redisClient as any }, 'runtime');

    const firstVersion = await first.ensureVersionKey('plugin-a');
    const secondVersion = await second.ensureVersionKey('plugin-a');

    expect(secondVersion).toBe(firstVersion);
    expect(redisStore.get('runtime:plugin-a')).toBe(firstVersion);
    expect(redisClient.getClient.set).toHaveBeenCalledWith(
      'runtime:plugin-a',
      expect.any(String),
      'NX'
    );
    expect(await second.isVersionKeyExpired('plugin-a')).toBe(false);
  });

  it('marks another store expired after refresh until it syncs the Redis value', async () => {
    const first = new VersionKeyStore({ redisClient: redisClient as any }, 'runtime');
    const second = new VersionKeyStore({ redisClient: redisClient as any }, 'runtime');

    await first.ensureVersionKey('plugin-a');
    await second.syncVersionKey('plugin-a');
    await first.refreshVersionKey('plugin-a');

    expect(await second.isVersionKeyExpired('plugin-a')).toBe(true);

    await second.syncVersionKey('plugin-a');

    expect(await second.isVersionKeyExpired('plugin-a')).toBe(false);
  });

  it('can refresh Redis without marking the local store as synced', async () => {
    const store = new VersionKeyStore({ redisClient: redisClient as any }, 'runtime');

    await store.refreshVersionKey('plugin-a', { syncLocal: false });

    expect(await store.isVersionKeyExpired('plugin-a')).toBe(true);
  });
});
