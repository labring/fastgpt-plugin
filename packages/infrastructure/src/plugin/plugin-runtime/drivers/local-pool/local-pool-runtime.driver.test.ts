import { describe, expect, it, vi } from 'vitest';

import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';

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

describe('LocalPoolPluginRuntimeManager unregister', () => {
  it('returns a failure result when the plugin is not cached', async () => {
    const manager = createManager();

    const [, err] = await manager.unregister({
      pluginId: 'weather',
      version: '1.0.0',
      etag: 'etag-weather'
    });

    expect(err?.reason.en).toBe('Plugin not found');

    await manager.shutdown();
  });
});

describe('LocalPoolPluginRuntimeManager invoke', () => {
  it('returns the original invoke error message when plugin service invoke fails', async () => {
    const manager = createManager();
    const startupError = new Error(
      '[test-service] Pod startup failed 3 times consecutively; pod creation has been disabled'
    );
    const runtimeId = 'localPool@weather@1.0.0@etag-weather';

    (manager as any).plugins.set(runtimeId, {
      config: {
        minPods: 0,
        maxPods: 1,
        podTimeout: 120000,
        maxConcurrentRequestsPerPod: 1
      },
      filePath: '/virtual/weather.js',
      service: {
        invoke: vi.fn(async () => {
          throw startupError;
        }),
        getMetrics: vi.fn()
      },
      meta: {
        pluginId: 'weather',
        version: '1.0.0',
        etag: 'etag-weather',
        type: PluginTypeEnum.tool,
        name: { en: 'Weather' },
        icon: 'https://example.com/icon.svg',
        description: { en: 'Weather' },
        toolDescription: 'Weather'
      },
      mutex: {
        acquire: vi.fn(),
        release: vi.fn()
      }
    });

    const [result, err] = await manager.invoke({
      uniqueId: {
        pluginId: 'weather',
        version: '1.0.0',
        etag: 'etag-weather'
      },
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(result).toBeNull();
    expect(err?.reason).toEqual({
      en: 'Invoke failed: [test-service] Pod startup failed 3 times consecutively; pod creation has been disabled',
      'zh-CN':
        '调用失败：[test-service] Pod startup failed 3 times consecutively; pod creation has been disabled'
    });
    expect(err?.error).toBe(startupError);

    await manager.shutdown();
  });
});
