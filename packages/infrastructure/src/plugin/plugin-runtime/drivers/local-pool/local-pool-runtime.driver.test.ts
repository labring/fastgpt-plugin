import { describe, expect, it, vi } from 'vitest';

import { LocalPoolPluginRuntimeManager } from './local-pool-runtime.driver';
import type { LocalPoolPluginConfigType } from './types';

const savedConfigs: Array<{ pluginId: string; config: LocalPoolPluginConfigType }> = [];

const pluginRuntimeConfigModel = {
  storedConfig: undefined as Record<string, unknown> | undefined,
  findOne: vi.fn(() => ({
    lean: vi.fn(async () =>
      pluginRuntimeConfigModel.storedConfig
        ? {
            config: pluginRuntimeConfigModel.storedConfig
          }
        : null
    )
  })),
  updateOne: vi.fn(
    async ({ pluginId }: { pluginId: string }, update: { $set: { config: any } }) => {
      savedConfigs.push({
        pluginId,
        config: update.$set.config
      });
    }
  ),
  deleteOne: vi.fn(async () => {})
};

const mongoClient = {
  getModel: vi.fn(() => pluginRuntimeConfigModel)
};

const redisClient = {
  getClient: {
    get: vi.fn(),
    set: vi.fn()
  }
};

const pluginRepo = {
  getPluginById: vi.fn()
};

function createManager() {
  (LocalPoolPluginRuntimeManager as any).instance = undefined;
  return LocalPoolPluginRuntimeManager.getInstance({
    mongoClient: mongoClient as any,
    redisClient: redisClient as any,
    pluginRepo: pluginRepo as any
  });
}

describe('LocalPoolPluginRuntimeManager config', () => {
  it('returns only plugin-scoped config fields', async () => {
    pluginRuntimeConfigModel.storedConfig = {
      minPods: 1,
      maxPods: 2,
      podTimeout: 120000,
      maxConcurrentRequestsPerPod: 10,
      idleTimeout: 60000,
      maxRequestsPerPod: 100,
      maxQueueSize: 500,
      queueTimeout: 60000
    };

    const manager = createManager();
    const [config, err] = await manager.getConfig('weather');

    expect(err).toBeNull();
    expect(config).toEqual({
      minPods: 1,
      maxPods: 2,
      podTimeout: 120000,
      maxConcurrentRequestsPerPod: 10
    });

    await manager.shutdown();
  });

  it('persists only plugin-scoped config fields', async () => {
    pluginRuntimeConfigModel.storedConfig = undefined;
    savedConfigs.length = 0;

    const manager = createManager();
    const [, err] = await manager.updateConfig('weather', {
      minPods: 1,
      maxPods: 2,
      podTimeout: 120000,
      maxConcurrentRequestsPerPod: 10,
      idleTimeout: 60000,
      maxRequestsPerPod: 100,
      maxQueueSize: 500,
      queueTimeout: 60000
    } as LocalPoolPluginConfigType);

    expect(err).toBeNull();
    expect(savedConfigs).toEqual([
      {
        pluginId: 'weather',
        config: {
          minPods: 1,
          maxPods: 2,
          podTimeout: 120000,
          maxConcurrentRequestsPerPod: 10
        }
      }
    ]);

    await manager.shutdown();
  });
});
