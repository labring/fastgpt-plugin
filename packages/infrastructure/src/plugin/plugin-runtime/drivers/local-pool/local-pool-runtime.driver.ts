/**
 * Plugin Manager
 * 1. 载入插件，管理插件在运行时的声明周期
 * 2. 运行插件
 * 3. 获取插件的信息
 */

import { Mutex } from 'es-toolkit';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { RedisClient } from '@infrastructure/redis/redis-client';

import { env } from '../../../../env';
import { getLogger, mod } from '../../../../logger';
import { VersionKeyStore } from '../../../../redis/version-key';
import type { MongoClient } from '../../../../storage/mongo';
import { PluginRuntimeConfigRepo } from '../../plugin-runtime-config.repo';

import { PluginService } from './service/index';
import { LOCAL_POOL_DEFAULT_PLUGIN_CONFIG, LOCAL_POOL_GLOBAL_SERVICE_CONFIG } from './const';
import type {
  DestroyOptions,
  GlobalMetrics,
  LocalPoolGlobalConfigType,
  LocalPoolPluginConfigType,
  LocalPoolPluginItemType,
  LocalPoolServiceConfigType,
  ServiceMetrics
} from './types';
import { LocalPoolPluginConfigSchema } from './types';

export type LocalPoolPluginRuntimeManagerDeps = {
  mongoClient: MongoClient;
  redisClient: RedisClient;
  pluginRepo: PluginRepoPort;
};

// ============ PluginManager ============

/**
 * 插件运行时管理器。
 * 底层是 IPC 通信，只允许 Node.js 环境使用。
 */
export class LocalPoolPluginRuntimeManager
  implements PluginRuntimeManagerPort<LocalPoolPluginConfigType>
{
  /** manager 级别的配置 */
  private readonly managerConfig: LocalPoolGlobalConfigType;
  /** 插件状态缓存 */
  private readonly plugins = new Map<string, LocalPoolPluginItemType>();
  /** key: pluginId, value: 这个 pluginId 对印的所有 id */
  private readonly pluginIdMap = new Map<string, string[]>();
  private versionKeyStore: VersionKeyStore;

  /** 插件运行时配置仓储 */
  private readonly configRepo: PluginRuntimeConfigRepo<LocalPoolPluginConfigType>;
  private logger = getLogger(mod.tool);

  /** manager 是否销毁（销毁则不再接收请求） */
  private destroyed = false;
  /** 定时健康检查 */
  private healthCheckTimer: NodeJS.Timeout | null = null;

  // 单例相关
  private static instance: LocalPoolPluginRuntimeManager;

  public static getInstance(deps: LocalPoolPluginRuntimeManagerDeps) {
    if (!LocalPoolPluginRuntimeManager.instance)
      LocalPoolPluginRuntimeManager.instance = new LocalPoolPluginRuntimeManager(deps);
    return LocalPoolPluginRuntimeManager.instance;
  }

  protected constructor(private deps: LocalPoolPluginRuntimeManagerDeps) {
    this.managerConfig = {
      healthCheckInterval: env.POOL_HEALTH_CHECK_INTERVAL,
      maxTotalPods: env.POOL_MAX_TOTAL_PODS
    };
    this.versionKeyStore = new VersionKeyStore(
      {
        redisClient: this.deps.redisClient
      },
      'plugin-runtime'
    );
    this.configRepo = new PluginRuntimeConfigRepo(
      {
        mongoClient: this.deps.mongoClient
      },
      LOCAL_POOL_DEFAULT_PLUGIN_CONFIG
    );
    this.startHealthCheck();
  }

  async globalStatus(): Promise<Result<GlobalMetrics>> {
    const totalPods = this.getTotalPods();
    const services = Object.fromEntries(
      [...this.plugins.entries()].map(([id, { service }]) => [id, service.getMetrics()])
    );

    const metrics = {
      services,
      totalPods,
      totalRequests: Object.values(services).reduce((sum, m) => sum + m.totalRequests, 0),
      totalServices: Object.keys(services).length
    } satisfies GlobalMetrics;
    return successResult(metrics);
  }

  /** uniqueId 转为一个字符串，可以直接从 map 中拿到 */
  private getRuntimeId({ etag, pluginId, version }: PluginUniqueIdType) {
    return `localPool@${pluginId}@${version}@${etag}`;
  }

  /**
   * 获得一个插件实例，检查该插件的 VersionKey，如果已经过期，则需要立即触发更新
   */
  private async getPlugin(uniqueId: PluginUniqueIdType) {
    const runtimeId = this.getRuntimeId(uniqueId);
    if (await this.versionKeyStore.isVersionKeyExpired(runtimeId)) {
      // 缓存过期，获取新数据

      // 1. 获取旧 service, 停机
      await this.unregister(uniqueId);

      await this.register(uniqueId);
    }
    // 缓存 key 命中，未过期
    // 或该插件不存在

    return this.plugins.get(runtimeId);
  }

  // ========================================
  //                  公开接口
  // ========================================

  async getConfig(pluginId: string): Promise<Result<LocalPoolPluginConfigType>> {
    const [config, err] = await this.configRepo.getPluginRuntimeConfig(pluginId);
    if (err) {
      return failureResult(
        {
          en: 'Failed to get plugin runtime config',
          'zh-CN': '获取插件运行时配置失败'
        },
        err
      );
    }
    const [pluginConfig, parseErr] = this.parsePluginConfig(config);
    if (parseErr) {
      return failureResult(parseErr);
    }

    return successResult(pluginConfig);
  }

  async updateConfig(pluginId: string, config: LocalPoolPluginConfigType): Promise<Result> {
    const [pluginConfig, parseErr] = this.parsePluginConfig(config);
    if (parseErr) {
      return failureResult(parseErr);
    }

    const [, err] = await this.configRepo.savePluginRuntimeConfig(pluginId, pluginConfig);
    if (err) {
      return failureResult(
        {
          en: 'Failed to update plugin runtime config',
          'zh-CN': '更新插件运行时配置失败'
        },
        err
      );
    }

    const pluginRuntimeIds = this.pluginIdMap.get(pluginId);
    if (!pluginRuntimeIds) {
      return successResult({});
    }

    await Promise.all(
      pluginRuntimeIds.map(async (runtimeId) => {
        const item = this.plugins.get(runtimeId);
        if (!item) {
          return;
        }
        try {
          await item.mutex.acquire();
          item.config = pluginConfig;
          await item.service.updateConfig(this.toServiceConfig(pluginConfig));
        } finally {
          item.mutex.release();
        }
      })
    );

    return successResult({});
  }

  async resetConfig(pluginId: string): Promise<Result> {
    const [config, err] = await this.configRepo.resetPluginRuntimeConfig(pluginId);
    if (err) {
      return failureResult(
        {
          en: 'Failed to reset plugin runtime config',
          'zh-CN': '重置插件运行时配置失败'
        },
        err
      );
    }

    const [pluginConfig, parseErr] = this.parsePluginConfig(config);
    if (parseErr) {
      return failureResult(parseErr);
    }

    const pluginRuntimeIds = this.pluginIdMap.get(pluginId);
    if (!pluginRuntimeIds) {
      return successResult({});
    }

    await Promise.all(
      pluginRuntimeIds.map(async (runtimeId) => {
        const item = this.plugins.get(runtimeId);
        if (!item) {
          return;
        }
        try {
          await item.mutex.acquire();
          item.config = pluginConfig;
          await item.service.updateConfig(this.toServiceConfig(pluginConfig));
        } finally {
          item.mutex.release();
        }
      })
    );

    return successResult({});
  }

  async status(uniqueId: PluginUniqueIdType): Promise<Result<ServiceMetrics>> {
    const metric = this.getPluginMetrics(this.getRuntimeId(uniqueId));
    return successResult(metric);
  }

  async shutdown(timeout?: number): Promise<Result> {
    try {
      await this.destroy({
        timeout,
        force: false
      });
    } catch (err) {
      return failureResult(
        {
          en: 'Error during shutdown',
          'zh-CN': '关闭过程中发生错误'
        },
        err
      );
    }
    return successResult({});
  }

  // ============ 注册 / 注销 ============

  /**
   * 注册一个插件。
   * IPC 模式下会初始化进程池（minPods 个 Pod 立即启动）。
   */
  async register(uniqueId: PluginUniqueIdType): Promise<Result> {
    const id = this.getRuntimeId(uniqueId);
    if (this.destroyed)
      return failureResult({
        en: 'PluginManager already destroyed',
        'zh-CN': '插件管理器已销毁'
      });

    if (this.plugins.has(id))
      return failureResult({
        en: 'Plugin already registered',
        'zh-CN': '插件已注册'
      });

    const [config, configErr] = await this.configRepo.getPluginRuntimeConfig(uniqueId.pluginId);

    if (configErr) {
      return failureResult({
        en: 'Failed to get plugin runtime config',
        'zh-CN': '获取插件运行时配置失败'
      });
    }

    const [pluginConfig, parseErr] = this.parsePluginConfig(config);
    if (parseErr) {
      return failureResult(parseErr);
    }

    const svcConfig = this.toServiceConfig(pluginConfig);

    // 检查全局 Pod 配额
    const currentPods = this.getTotalPods();
    if (currentPods + svcConfig.minPods > this.managerConfig.maxTotalPods) {
      this.logger.warn('Plugin registration rejected because pod quota was exceeded', {
        current: currentPods,
        requested: svcConfig.minPods,
        max: this.managerConfig.maxTotalPods,
        pluginId: id
      });

      return failureResult({
        en: `Pod quota exceeded: current=${currentPods}, required=${svcConfig.minPods}, max=${this.managerConfig.maxTotalPods}`,
        'zh-CN': `Pod 配额超出：当前=${currentPods}, 需要=${svcConfig.minPods}, 最大=${this.managerConfig.maxTotalPods}`
      });
    }

    const [info, err] = await this.deps.pluginRepo.getPluginById(uniqueId);
    if (err) {
      return failureResult(
        {
          en: 'Register plugin error, can not get plugin info',
          'zh-CN': '注册插件失败，无法获取插件信息'
        },
        err
      );
    }
    const service = new PluginService(
      id,
      info.entryFilePath,
      svcConfig,
      {
        onPodCreated: () => {
          const totalPods = this.getTotalPods();
          if (totalPods > this.managerConfig.maxTotalPods) {
            this.logger.warn('Plugin runtime exceeded global pod quota', {
              current: totalPods,
              max: this.managerConfig.maxTotalPods,
              pluginId: id
            });
          }
        },
        onRequestCompleted: ({ duration }: { requestId: string; duration: number }) => {
          this.logger.debug(`Plugin request completed`, { pluginId: id, duration });
          // this.globalMetrics.globalTotalRequests++;
          // this.globalMetrics.globalResponseTimes.push(duration);
          // if (this.globalMetrics.globalResponseTimes.length > 2000) {
          //   this.globalMetrics.globalResponseTimes.shift();
          // }
        },
        onRequestFailed: ({ error }: { requestId: string; error: unknown }) => {
          this.logger.error(`Plugin request failed`, { pluginId: id, error });
          // this.globalMetrics.globalTotalRequests++;
          // this.globalMetrics.globalErrors++;
        },
        onPodLog: ({
          podId,
          level,
          message
        }: {
          podId: string;
          level: 'debug' | 'error';
          message: string;
        }) => {
          const prefix = `[plugin:${id}][pod:${podId.slice(0, 8)}]`;
          if (level === 'error') {
            this.logger.error(`${prefix} ${message}`);
          } else {
            this.logger.debug(`${prefix} ${message}`);
          }
        }
      },
      info.info.permission ?? []
    );

    await service.initialize();

    this.plugins.set(id, {
      config: pluginConfig,
      filePath: info.entryFilePath,
      service,
      meta: info.info,
      mutex: new Mutex()
    });
    this.addPluginRuntimeId(uniqueId.pluginId, id);

    return successResult({});
  }

  /**
   * 注销一个插件，优雅关闭其进程池。
   */
  async unregister(uniqueId: PluginUniqueIdType): Promise<Result> {
    const id = this.getRuntimeId(uniqueId);

    const record = this.plugins.get(id);
    if (!record) {
      return failureResult({
        en: 'Plugin not found',
        'zh-CN': '插件未找到'
      });
    }

    await record.service.destroy();
    this.plugins.delete(id);
    this.removePluginRuntimeId(uniqueId.pluginId, id);
    return successResult({});
  }

  async invoke<
    E extends PluginInvokeEventNameType,
    P = unknown,
    R = unknown,
    S extends boolean = boolean
  >({
    uniqueId,
    eventName,
    payload,
    returnStream,
    options
  }: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    if (this.destroyed)
      return failureResult({
        en: 'PluginManager already destoryed',
        'zh-CN': '插件管理器已销毁'
      });

    const plugin = await this.getPlugin(uniqueId);
    if (!plugin) return failureResult({ en: 'Plugin not found', 'zh-CN': '插件未找到' });

    // 判断插件是否能调用这个方法
    // TODO: 这个逻辑应该抽出去
    const check = () => {
      if (plugin.meta.type === 'tool' && eventName === 'run') {
        return true;
      }
      return false;
    };

    if (check()) {
      try {
        const result = await plugin.service.invoke<P, R, S>({
          eventName,
          payload,
          returnStream,
          options
        });
        return successResult(result);
      } catch (error) {
        return failureResult({ en: 'Invoke failed', 'zh-CN': '调用失败' }, error);
      }
    }
    return failureResult({ en: 'Event not supported', 'zh-CN': '不支持的事件' });
  }

  // ============ 指标 ============

  getPluginMetrics(id: string): ServiceMetrics {
    const record = this.plugins.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);
    return record.service.getMetrics();
  }

  // ============ 销毁 ============

  private async destroy(options?: DestroyOptions): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    await Promise.all([...this.plugins.values()].map(({ service }) => service.destroy(options)));
    this.plugins.clear();
  }

  // ============ 内部 ============

  private getTotalPods(): number {
    let total = 0;
    for (const { service } of this.plugins.values()) {
      total += service.getMetrics().pods.total;
    }
    return total;
  }

  private toServiceConfig(config: LocalPoolPluginConfigType): LocalPoolServiceConfigType {
    return {
      ...config,
      ...LOCAL_POOL_GLOBAL_SERVICE_CONFIG
    };
  }

  private parsePluginConfig(config: LocalPoolPluginConfigType): Result<LocalPoolPluginConfigType> {
    const result = LocalPoolPluginConfigSchema.safeParse(config);

    if (!result.success) {
      return failureResult(
        {
          en: 'Invalid plugin runtime config',
          'zh-CN': '插件运行时配置无效'
        },
        result.error
      );
    }

    return successResult(result.data);
  }

  private addPluginRuntimeId(pluginId: string, runtimeId: string): void {
    const runtimeIds = this.pluginIdMap.get(pluginId) ?? [];
    if (!runtimeIds.includes(runtimeId)) {
      runtimeIds.push(runtimeId);
    }
    this.pluginIdMap.set(pluginId, runtimeIds);
  }

  private removePluginRuntimeId(pluginId: string, runtimeId: string): void {
    const runtimeIds = this.pluginIdMap.get(pluginId);
    if (!runtimeIds) {
      return;
    }

    const nextRuntimeIds = runtimeIds.filter((id) => id !== runtimeId);
    if (nextRuntimeIds.length === 0) {
      this.pluginIdMap.delete(pluginId);
      return;
    }

    this.pluginIdMap.set(pluginId, nextRuntimeIds);
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      const pluginIds: string[] = [];

      for (const [id, { service }] of this.plugins) {
        pluginIds.push(id);
        const m = service.getMetrics();
        if (m.pods.total === 0 && (service as any).config?.minPods > 0) {
          this.logger.warn('Plugin unhealthy: no available pods', { pluginId: id });
        }
        if (m.errorRate > 0.5) {
          this.logger.warn('Plugin unhealthy: error rate too high', {
            pluginId: id,
            errorRate: m.errorRate
          });
        }
      }
    }, this.managerConfig.healthCheckInterval);

    // 不阻塞进程退出
    this.healthCheckTimer.unref?.();
  }
}
