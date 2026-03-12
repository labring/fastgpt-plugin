import { EventEmitter } from 'node:events';
import { PluginService } from '../process_pool/plugin_service';
import { getLogger, mod } from '@/lib/logger';
import type {
  ServiceConfig,
  ServiceMetrics,
  GlobalMetrics,
  InvokeOptions,
  DestroyOptions,
} from '../process_pool/types';

// ============ 配置类型 ============

export type PluginMode = 'ipc'; // future: 'tcp' | 'http'

export type PluginType = 'tool' | 'dataset' | 'model';

export interface PluginManagerConfig {
  mode: PluginMode;
  /** 全局最大 Pod 总数（IPC 模式） */
  maxTotalPods?: number;
  /** 健康检查间隔（ms） */
  healthCheckInterval?: number;
}

export interface PluginRegistration {
  type: PluginType;
  /**
   * IPC 模式：插件文件路径（.js 或 .ts）
   * 未来 TCP 模式：{ host, port }
   * 未来 HTTP 模式：{ url }
   */
  pluginPath: string;
  /** 进程池配置（IPC 模式） */
  serviceConfig?: Partial<ServiceConfig>;
}

const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  minPods: 0,
  maxPods: 5,
  idleTimeout: 60_000,
  podTimeout: 30_000,
  maxRequestsPerPod: 100,
  maxConcurrentRequestsPerPod: 1,
  maxQueueSize: 500,
};

// ============ 事件类型 ============

export interface PluginManagerEvents {
  pluginRegistered: (event: { pluginId: string; type: PluginType }) => void;
  pluginUnregistered: (event: { pluginId: string }) => void;
  pluginUnhealthy: (event: { pluginId: string; reason: string }) => void;
  quotaExceeded: (event: { current: number; max: number }) => void;
  healthCheck: (event: { timestamp: number; plugins: string[] }) => void;
}

// ============ 内部记录类型 ============

interface PluginRecord {
  type: PluginType;
  pluginPath: string;
  service: PluginService;
}

// ============ PluginManager ============

/**
 * 插件运行时管理器。
 *
 * 统一入口，屏蔽底层通信模式（IPC / TCP / HTTP）的差异。
 * 当前实现 IPC 模式（进程池），其他模式预留扩展点。
 *
 * @example
 * const manager = new PluginManager({ mode: 'ipc', maxTotalPods: 50 });
 * await manager.register('my-tool', { type: 'tool', pluginPath: '/path/to/plugin.js' });
 * const result = await manager.invoke('my-tool', 'execute', { inputs, systemVar });
 * await manager.destroy();
 */
export class PluginManager extends EventEmitter {
  private readonly config: Required<PluginManagerConfig>;
  private readonly plugins = new Map<string, PluginRecord>();
  private destroyed = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  // 全局统计（IPC 模式）
  private globalResponseTimes: number[] = [];
  private globalTotalRequests = 0;

  constructor(config: PluginManagerConfig) {
    super();
    this.config = {
      mode: config.mode,
      maxTotalPods: config.maxTotalPods ?? 100,
      healthCheckInterval: config.healthCheckInterval ?? 30_000,
    };
    this.startHealthCheck();
  }

  // ============ 注册 / 注销 ============

  /**
   * 注册一个插件。
   * IPC 模式下会初始化进程池（minPods 个 Pod 立即启动）。
   */
  async register(id: string, registration: PluginRegistration): Promise<void> {
    if (this.destroyed) throw new Error('PluginManager already destroyed');
    if (this.plugins.has(id)) throw new Error(`Plugin already registered: ${id}`);

    const serviceConfig: ServiceConfig = {
      ...DEFAULT_SERVICE_CONFIG,
      ...registration.serviceConfig,
    };

    // 检查全局 Pod 配额
    const currentPods = this.getTotalPods();
    if (currentPods + serviceConfig.minPods > this.config.maxTotalPods) {
      this.emit('quotaExceeded', { current: currentPods, max: this.config.maxTotalPods });
      throw new Error(
        `Pod quota exceeded: current=${currentPods}, required=${serviceConfig.minPods}, max=${this.config.maxTotalPods}`
      );
    }

    const service = new PluginService(id, registration.pluginPath, serviceConfig);

    // 监听 Pod 创建，检测全局配额
    service.on('podCreated', () => {
      if (this.getTotalPods() > this.config.maxTotalPods) {
        this.emit('quotaExceeded', { current: this.getTotalPods(), max: this.config.maxTotalPods });
      }
    });

    // 汇总全局统计
    service.on('requestCompleted', ({ duration }: { requestId: string; duration: number }) => {
      this.globalTotalRequests++;
      this.globalResponseTimes.push(duration);
      if (this.globalResponseTimes.length > 2000) this.globalResponseTimes.shift();
    });

    // 转发子进程日志到 server logger
    service.on('podLog', ({ podId, level, message }: { podId: string; level: 'debug' | 'error'; message: string }) => {
      const logger = getLogger(mod.tool);
      const prefix = `[plugin:${id}][pod:${podId.slice(0, 8)}]`;
      if (level === 'error') {
        logger.error(`${prefix} ${message}`);
      } else {
        logger.debug(`${prefix} ${message}`);
      }
    });

    await service.initialize();

    this.plugins.set(id, { type: registration.type, pluginPath: registration.pluginPath, service });
    this.emit('pluginRegistered', { pluginId: id, type: registration.type });
  }

  /**
   * 注销一个插件，优雅关闭其进程池。
   */
  async unregister(id: string): Promise<void> {
    const record = this.plugins.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);

    await record.service.destroy();
    this.plugins.delete(id);
    this.emit('pluginUnregistered', { pluginId: id });
  }

  // ============ 调用 ============

  /**
   * 调用插件的某个方法。
   *
   * @param id       插件 ID
   * @param method   方法名（如 'execute' / 'search' / 'generate'）
   * @param params   参数（JSON 可序列化）
   * @param options  超时、优先级等选项
   */
  async invoke(
    id: string,
    method: string,
    params: unknown,
    options?: InvokeOptions
  ): Promise<unknown> {
    if (this.destroyed) throw new Error('PluginManager already destroyed');

    const record = this.plugins.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);

    return record.service.invoke(method, params, options);
  }

  // ============ 指标 ============

  getPluginMetrics(id: string): ServiceMetrics {
    const record = this.plugins.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);
    return record.service.getMetrics();
  }

  getGlobalMetrics(): GlobalMetrics {
    let totalRequests = 0;
    let totalErrors = 0;

    for (const { service } of this.plugins.values()) {
      const m = service.getMetrics();
      totalRequests += m.totalRequests;
      totalErrors += m.totalRequests * m.errorRate;
    }

    const avgResponseTime =
      this.globalResponseTimes.length > 0
        ? this.globalResponseTimes.reduce((s, t) => s + t, 0) / this.globalResponseTimes.length
        : 0;

    return {
      totalServices: this.plugins.size,
      totalPods: this.getTotalPods(),
      totalRequests,
      avgResponseTime,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    };
  }

  // ============ 查询 ============

  /**
   * 获取插件的配置信息（schemas 等）。
   * tool 类型返回 { type: 'tool', tools: { [name]: { input, output } } }
   */
  async getConfig(id: string): Promise<Record<string, unknown>> {
    const result = await this.invoke(id, 'getConfig', null);
    return result as Record<string, unknown>;
  }

  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * 即时更新插件的进程池配置（IPC 模式）。
   * 同步到运行中的 PluginService，无需重启。
   */
  async updateServiceConfig(
    id: string,
    config: Partial<Pick<ServiceConfig, 'minPods' | 'maxPods' | 'maxConcurrentRequestsPerPod'>>
  ): Promise<void> {
    const record = this.plugins.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);
    await record.service.updateConfig(config);
  }

  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  getPluginType(id: string): PluginType | undefined {
    return this.plugins.get(id)?.type;
  }

  // ============ 销毁 ============

  async destroy(options?: DestroyOptions): Promise<void> {
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

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      const timestamp = Date.now();
      const pluginIds: string[] = [];

      for (const [id, { service }] of this.plugins) {
        pluginIds.push(id);
        const m = service.getMetrics();
        if (m.pods.total === 0 && (service as any).config?.minPods > 0) {
          this.emit('pluginUnhealthy', { pluginId: id, reason: 'No available Pods' });
        }
        if (m.errorRate > 0.5) {
          this.emit('pluginUnhealthy', {
            pluginId: id,
            reason: `Error rate too high: ${(m.errorRate * 100).toFixed(1)}%`,
          });
        }
      }

      this.emit('healthCheck', { timestamp, plugins: pluginIds });
    }, this.config.healthCheckInterval);

    // 不阻塞进程退出
    this.healthCheckTimer.unref?.();
  }
}
