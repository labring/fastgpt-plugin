import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';
import { RegisteredError } from '@domain/value-objects/error.vo';
import { successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import { __getRuntimeGaugeSourcesForTest } from '@infrastructure/metrics';

import { LocalPoolPluginRuntimeManager } from './local-pool-runtime.driver';
import type { LocalPoolPluginConfigType } from './types';

const serviceMockState = vi.hoisted(() => {
  const instances: Array<{
    serviceName: string;
    config: unknown;
    initialize: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    drainTo: ReturnType<typeof vi.fn>;
    invoke: ReturnType<typeof vi.fn>;
    getMetrics: ReturnType<typeof vi.fn>;
  }> = [];

  const PluginService = vi.fn(function (
    serviceName: string,
    _pluginPath: string,
    config: unknown
  ) {
    const instance = {
      serviceName,
      config,
      initialize: vi.fn(async () => {}),
      updateConfig: vi.fn(async () => {}),
      destroy: vi.fn(async () => {}),
      drainTo: vi.fn(async () => {}),
      invoke: vi.fn(async () => ({ serviceName })),
      getMetrics: vi.fn(() => ({
        pods: { total: 0, running: 0, busy: 0, idle: 0, pending: 0 },
        queueLength: 0,
        responseTime: { avg: 0, p95: 0 },
        rps: 0,
        errorRate: 0,
        crashCount: 0,
        totalRequests: 0
      }))
    };
    instances.push(instance);
    return instance;
  });

  return { instances, PluginService };
});

vi.mock('./service/index', () => ({
  PluginService: serviceMockState.PluginService
}));

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
      pluginRuntimeConfigModel.storedConfig = update.$set.config;
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

const redisStore = new Map<string, string>();
const redisClient = {
  getClient: {
    get: vi.fn(),
    set: vi.fn()
  }
};

const pluginRepo = {
  getPluginById: vi.fn()
};

const weatherPluginInfo = (overrides: Record<string, unknown> = {}) => ({
  pluginId: 'weather',
  version: '1.0.0',
  etag: 'etag-weather',
  type: PluginTypeEnum.tool,
  name: { en: 'Weather' },
  icon: 'https://example.com/icon.svg',
  description: { en: 'Weather' },
  toolDescription: 'Weather',
  ...overrides
});

const weatherUniqueId = {
  pluginId: 'weather',
  version: '1.0.0',
  etag: 'etag-weather'
};

const runtimeId = 'localPool@weather@1.0.0@etag-weather';
const runtimeRedisKey = `plugin-runtime:${runtimeId}`;
const configRedisKey = 'plugin-runtime:localPoolConfig@weather';

const pluginConfig = (overrides: Partial<LocalPoolPluginConfigType> = {}) => ({
  minPods: 0,
  maxPods: 2,
  podTimeout: 120000,
  maxConcurrentRequestsPerPod: 10,
  ...overrides
});

function createManager() {
  (LocalPoolPluginRuntimeManager as any).instance = undefined;
  return LocalPoolPluginRuntimeManager.getInstance({
    mongoClient: mongoClient as any,
    redisClient: redisClient as any,
    pluginRepo: pluginRepo as any
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  savedConfigs.length = 0;
  redisStore.clear();
  serviceMockState.instances.length = 0;
  pluginRuntimeConfigModel.storedConfig = undefined;
  redisClient.getClient.get.mockImplementation(async (key: string) => redisStore.get(key) ?? null);
  redisClient.getClient.set.mockImplementation(
    async (key: string, value: string, mode?: string) => {
      if (mode === 'NX' && redisStore.has(key)) {
        return null;
      }
      redisStore.set(key, value);
      return 'OK';
    }
  );
  pluginRepo.getPluginById.mockResolvedValue(
    successResult({
      info: weatherPluginInfo(),
      indexFile: {},
      entryFilePath: '/virtual/weather.js'
    })
  );
});

describe('LocalPoolPluginRuntimeManager config', () => {
  it('registers and unregisters a local-pool runtime gauge source', async () => {
    const manager = createManager();

    expect(__getRuntimeGaugeSourcesForTest()).toEqual([
      expect.objectContaining({
        runtimeMode: 'localPool'
      })
    ]);

    await manager.shutdown();

    expect(__getRuntimeGaugeSourcesForTest()).toEqual([]);
  });

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

describe('LocalPoolPluginRuntimeManager version keys', () => {
  it('publishes a runtime version key when a runtime is registered', async () => {
    const manager = createManager();

    const [, err] = await manager.register(weatherUniqueId);

    expect(err).toBeNull();
    expect(redisStore.get(runtimeRedisKey)).toBeDefined();
    expect(redisClient.getClient.set).toHaveBeenCalledWith(
      runtimeRedisKey,
      expect.any(String),
      'NX'
    );

    await manager.shutdown();
  });

  it('keeps an existing runtime key stable and syncs it locally during startup', async () => {
    redisStore.set(runtimeRedisKey, 'remote-runtime-version');
    const manager = createManager();

    const [, registerErr] = await manager.register(weatherUniqueId);
    const [, invokeErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(registerErr).toBeNull();
    expect(invokeErr).toBeNull();
    expect(redisStore.get(runtimeRedisKey)).toBe('remote-runtime-version');
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(1);
    expect(serviceMockState.instances[0].invoke).toHaveBeenCalledTimes(1);

    await manager.shutdown();
  });

  it('lazily registers a runtime on another node when Redis has a newer runtime key', async () => {
    redisStore.set(runtimeRedisKey, 'remote-runtime-version');
    const manager = createManager();

    const [firstResult, firstErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });
    const [secondResult, secondErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(firstErr).toBeNull();
    expect(secondErr).toBeNull();
    expect(firstResult).toEqual({ serviceName: runtimeId });
    expect(secondResult).toEqual({ serviceName: runtimeId });
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(1);
    expect(pluginRepo.getPluginById).toHaveBeenCalledTimes(1);

    await manager.shutdown();
  });

  it('reloads a cached runtime once after another node refreshes the config key', async () => {
    const manager = createManager();
    await manager.register(weatherUniqueId);
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(1);

    redisStore.set(configRedisKey, 'remote-config-version');
    const [, firstErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });
    const [, secondErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(firstErr).toBeNull();
    expect(secondErr).toBeNull();
    expect(serviceMockState.instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(2);
    expect(pluginRepo.getPluginById).toHaveBeenCalledTimes(2);

    await manager.shutdown();
  });

  it('refreshes the config key for unloaded runtimes without marking the local node synced', async () => {
    const manager = createManager();

    const [, configErr] = await manager.updateConfig(
      'weather',
      pluginConfig({
        minPods: 1,
        maxPods: 3
      })
    );
    const [, invokeErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(configErr).toBeNull();
    expect(invokeErr).toBeNull();
    expect(redisStore.get(configRedisKey)).toBeDefined();
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(1);
    expect(serviceMockState.instances[0].config).toEqual(
      expect.objectContaining({
        minPods: 1,
        maxPods: 3
      })
    );

    await manager.shutdown();
  });

  it('updates loaded services locally and syncs the config key after config changes', async () => {
    const manager = createManager();
    await manager.register(weatherUniqueId);

    const [, configErr] = await manager.updateConfig(
      'weather',
      pluginConfig({
        minPods: 1,
        maxPods: 3
      })
    );
    const [, invokeErr] = await manager.invoke({
      uniqueId: weatherUniqueId,
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(configErr).toBeNull();
    expect(invokeErr).toBeNull();
    expect(serviceMockState.instances[0].updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        minPods: 1,
        maxPods: 3
      })
    );
    expect(serviceMockState.PluginService).toHaveBeenCalledTimes(1);

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

  it('drains a cached plugin service to its replacement before unregistering it', async () => {
    const manager = createManager();
    const oldRuntimeId = 'localPool@weather@1.0.0@old-etag';
    const newRuntimeId = 'localPool@weather@1.0.0@new-etag';
    const oldService = {
      drainTo: vi.fn(async () => {}),
      destroy: vi.fn(),
      getMetrics: vi.fn(() => ({
        pods: { total: 0 }
      }))
    };
    const newService = {
      destroy: vi.fn(),
      getMetrics: vi.fn(() => ({
        pods: { total: 0 }
      }))
    };
    const item = (etag: string, service: unknown) => ({
      config: {
        minPods: 0,
        maxPods: 1,
        podTimeout: 120000,
        maxConcurrentRequestsPerPod: 1
      },
      filePath: `/virtual/${etag}.js`,
      service,
      meta: {
        pluginId: 'weather',
        version: '1.0.0',
        etag,
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

    (manager as any).plugins.set(oldRuntimeId, item('old-etag', oldService));
    (manager as any).plugins.set(newRuntimeId, item('new-etag', newService));
    (manager as any).pluginIdMap.set('weather', [oldRuntimeId, newRuntimeId]);

    const [, err] = await manager.unregister(
      {
        pluginId: 'weather',
        version: '1.0.0',
        etag: 'old-etag'
      },
      {
        replacementUniqueId: {
          pluginId: 'weather',
          version: '1.0.0',
          etag: 'new-etag'
        }
      }
    );

    expect(err).toBeNull();
    expect(oldService.drainTo).toHaveBeenCalledWith(newService);
    expect(oldService.destroy).not.toHaveBeenCalled();
    expect((manager as any).plugins.has(oldRuntimeId)).toBe(false);
    expect((manager as any).plugins.has(newRuntimeId)).toBe(true);
    expect((manager as any).pluginIdMap.get('weather')).toEqual([newRuntimeId]);

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
    expect(err?.error).toBeInstanceOf(RegisteredError);
    expect((err?.error as RegisteredError).code).toBe(ErrorCode.pluginInvokeFailed);
    expect(err?.error.cause).toBe(startupError);

    await manager.shutdown();
  });

  it('returns a readable timeout reason for local-pool invoke timeouts', async () => {
    const manager = createManager();
    const timeoutError = Object.assign(new Error('Request timeout: request'), {
      code: 'REQUEST_TIMEOUT',
      method: 'run',
      timeoutMs: 30_000
    });
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
          throw timeoutError;
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
      en: 'Plugin invocation timed out after 30000ms while handling event "run"',
      'zh-CN': '插件调用超时（30000ms），事件：run'
    });
    expect(err?.error).toBeInstanceOf(RegisteredError);
    expect((err?.error as RegisteredError).code).toBe(ErrorCode.pluginInvokeTimeout);
    expect(err?.error.cause).toBe(timeoutError);

    await manager.shutdown();
  });

  it('returns a readable timeout reason for local-pool queue timeouts', async () => {
    const manager = createManager();
    const queueError = Object.assign(new Error('Queue wait timeout'), {
      code: 'QUEUE_TIMEOUT',
      method: 'run',
      timeoutMs: 20_000
    });
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
          throw queueError;
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
      en: 'Plugin invocation waited too long for an available local-pool pod after 20000ms while handling event "run"',
      'zh-CN': '插件调用等待空闲本地运行实例超时（20000ms），事件：run'
    });
    expect(err?.error).toBeInstanceOf(RegisteredError);
    expect((err?.error as RegisteredError).code).toBe(ErrorCode.pluginInvokeQueueTimeout);
    expect(err?.error.cause).toBe(queueError);

    await manager.shutdown();
  });
});
