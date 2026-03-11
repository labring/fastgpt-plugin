import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { PluginPod } from './plugin_pod';
import type {
  ServiceConfig,
  ServiceMetrics,
  InvokeOptions,
  DestroyOptions,
  PodInfo,
  PluginServiceEvents,
} from './types';

interface QueuedRequest {
  requestId: string;
  method: string;
  params: any;
  options?: InvokeOptions;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  queuedAt: number;
  timeout?: NodeJS.Timeout;
}

export class PluginService extends EventEmitter {
  private pods = new Map<string, PluginPod>();
  private queue: QueuedRequest[] = [];
  private initialized = false;
  private destroyed = false;
  private idleCheckTimer: NodeJS.Timeout | null = null;

  // 统计信息
  private totalRequests = 0;
  private completedRequests = 0;
  private failedRequests = 0;
  private crashCount = 0;
  private responseTimes: number[] = [];

  constructor(
    public readonly serviceName: string,
    private pluginPath: string,
    private config: ServiceConfig
  ) {
    super();
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (this.config.minPods < 0) {
      throw new Error('minPods must be >= 0');
    }
    if (this.config.maxPods <= 0) {
      throw new Error('maxPods must be > 0');
    }
    if (this.config.minPods > this.config.maxPods) {
      throw new Error('minPods cannot be greater than maxPods');
    }
    if (this.config.idleTimeout <= 0) {
      throw new Error('idleTimeout must be > 0');
    }
    if (this.config.podTimeout <= 0) {
      throw new Error('podTimeout must be > 0');
    }
    if (this.config.maxRequestsPerPod <= 0) {
      throw new Error('maxRequestsPerPod must be > 0');
    }
    if (this.config.maxQueueSize <= 0) {
      throw new Error('maxQueueSize must be > 0');
    }
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Service already initialized');
    }
    if (this.destroyed) {
      throw new Error('Service already destroyed');
    }

    // 创建最小数量的 Pod
    const createPromises: Promise<PluginPod>[] = [];
    for (let i = 0; i < this.config.minPods; i++) {
      createPromises.push(this.createPod());
    }

    await Promise.all(createPromises);

    // 启动空闲检查定时器
    this.startIdleCheck();

    this.initialized = true;
  }

  /**
   * 调用插件方法
   */
  async invoke(method: string, params: any, options?: InvokeOptions): Promise<any> {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    if (this.destroyed) {
      throw new Error('Service already closed');
    }

    this.totalRequests++;
    const startTime = Date.now();

    // 尝试立即获取可用的 Pod
    let pod = this.findIdlePod();

    // 如果没有空闲 Pod，尝试创建新 Pod
    if (!pod && this.pods.size < this.config.maxPods) {
      try {
        pod = await this.createPod();
      } catch (error) {
        // 创建失败，继续排队
      }
    }

    // 如果有可用 Pod，直接执行
    if (pod) {
      try {
        const result = await pod.invoke(method, params, options);

        // 记录响应时间
        const duration = Date.now() - startTime;
        this.responseTimes.push(duration);
        if (this.responseTimes.length > 1000) {
          this.responseTimes.shift();
        }

        this.completedRequests++;
        this.emit('requestCompleted', { requestId: randomUUID(), duration });

        // 释放 Pod
        this.releasePod(pod);

        return result;
      } catch (error) {
        this.failedRequests++;
        this.emit('requestFailed', { requestId: randomUUID(), error });

        // 释放 Pod
        this.releasePod(pod);

        throw error;
      }
    }

    // 没有可用 Pod，排队等待
    return this.queueAndWait(method, params, options, startTime);
  }

  /**
   * 排队并等待执行
   */
  private queueAndWait(
    method: string,
    params: any,
    options: InvokeOptions | undefined,
    startTime: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 检查队列是否已满
      if (this.queue.length >= this.config.maxQueueSize) {
        this.failedRequests++;
        reject(new Error('Queue is full'));
        return;
      }

      const requestId = randomUUID();
      const queueTimeout = this.config.queueTimeout || 30000;

      // 设置队列等待超时
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(r => r.requestId === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        this.failedRequests++;
        reject(new Error('Queue wait timeout'));
      }, queueTimeout);

      const queuedRequest: QueuedRequest = {
        requestId,
        method,
        params,
        options,
        resolve: async (pod: PluginPod) => {
          try {
            const result = await pod.invoke(method, params, options);

            // 记录响应时间
            const duration = Date.now() - startTime;
            this.responseTimes.push(duration);
            if (this.responseTimes.length > 1000) {
              this.responseTimes.shift();
            }

            this.completedRequests++;
            this.emit('requestCompleted', { requestId, duration });

            // 释放 Pod
            this.releasePod(pod);

            resolve(result);
          } catch (error) {
            this.failedRequests++;
            this.emit('requestFailed', { requestId, error });

            // 释放 Pod
            this.releasePod(pod);

            reject(error);
          }
        },
        reject,
        queuedAt: Date.now(),
        timeout,
      };

      // 按优先级排序（优先级高的在前）
      const priority = options?.priority || 0;
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        const qPriority = this.queue[i].options?.priority || 0;
        if (priority > qPriority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, queuedRequest);
      this.emit('requestQueued', requestId);

      // 尝试立即处理队列
      this.processQueue();
    });
  }

  /**
   * 查找空闲的 Pod
   */
  private findIdlePod(): PluginPod | null {
    for (const pod of this.pods.values()) {
      if (pod.isAvailable()) {
        return pod;
      }
    }
    return null;
  }

  /**
   * 创建新 Pod
   */
  private async createPod(): Promise<PluginPod> {
    const podId = randomUUID();
    const pod = new PluginPod(podId, {
      pluginPath: this.pluginPath,
      podTimeout: this.config.podTimeout,
      maxRequests: this.config.maxRequestsPerPod,
    });

    // 监听 Pod 事件
    pod.on('ready', (info: PodInfo) => {
      this.emit('podReady', info);
    });

    pod.on('error', (error: Error) => {
      this.handlePodError(pod, error);
    });

    pod.on('exit', ({ code, signal, wasRunning }) => {
      this.handlePodExit(pod, code, signal, wasRunning);
    });

    pod.on('timeout', ({ requestId, method }) => {
      this.handlePodTimeout(pod, requestId, method);
    });

    // 启动 Pod
    await pod.start();

    this.pods.set(podId, pod);
    this.emit('podCreated', pod.getInfo());

    return pod;
  }

  /**
   * 释放 Pod
   */
  private releasePod(pod: PluginPod): void {
    // 检查是否需要重启 Pod（达到最大请求数）
    if (pod.getInfo().requestsExecuted >= this.config.maxRequestsPerPod) {
      this.destroyPod(pod.podId);
      // 如果低于最小数量，创建新 Pod
      if (this.pods.size < this.config.minPods) {
        this.createPod().catch((error) => {
          console.error('Failed to create Pod:', error);
        });
      }
      return;
    }

    // 处理队列中的请求
    this.processQueue();
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    while (this.queue.length > 0) {
      const idlePod = this.findIdlePod();
      if (!idlePod) {
        break;
      }

      const queuedRequest = this.queue.shift();
      if (!queuedRequest) {
        break;
      }

      if (queuedRequest.timeout) {
        clearTimeout(queuedRequest.timeout);
      }

      // 直接调用 resolve，它会执行完整的请求
      queuedRequest.resolve(idlePod);
    }
  }

  /**
   * 处理 Pod 错误
   */
  private handlePodError(pod: PluginPod, error: Error): void {
    console.error(`Pod ${pod.podId} error:`, error);
    this.emit('podCrashed', pod.getInfo(), error);
  }

  /**
   * 处理 Pod 退出
   */
  private handlePodExit(pod: PluginPod, code: number | null, signal: string | null, wasRunning: boolean): void {
    this.pods.delete(pod.podId);
    this.emit('podDestroyed', pod.getInfo());

    if (wasRunning) {
      this.crashCount++;
    }

    // 如果低于最小数量，自动补充
    if (this.pods.size < this.config.minPods && !this.destroyed) {
      this.createPod().catch((error) => {
        console.error('Failed to auto-replenish Pod:', error);
      });
    }

    // 处理队列
    this.processQueue();
  }

  /**
   * 处理 Pod 超时
   */
  private handlePodTimeout(pod: PluginPod, requestId: string, method: string): void {
    console.error(`Pod ${pod.podId} request timeout: ${method}`);
    this.destroyPod(pod.podId);

    // 自动补充
    if (this.pods.size < this.config.minPods && !this.destroyed) {
      this.createPod().catch((error) => {
        console.error('Failed to replenish Pod:', error);
      });
    }
  }

  /**
   * 销毁 Pod
   */
  private destroyPod(podId: string): void {
    const pod = this.pods.get(podId);
    if (!pod) {
      return;
    }

    pod.kill();
    this.pods.delete(podId);
  }

  /**
   * 启动空闲检查
   */
  private startIdleCheck(): void {
    this.idleCheckTimer = setInterval(() => {
      this.checkIdlePods();
    }, 5000);
  }

  /**
   * 检查空闲的 Pod
   */
  private checkIdlePods(): void {
    if (this.pods.size <= this.config.minPods) {
      return;
    }

    const now = Date.now();
    for (const pod of this.pods.values()) {
      if (this.pods.size <= this.config.minPods) {
        break;
      }

      if (pod.isIdle() && pod.getIdleTime() > this.config.idleTimeout) {
        this.destroyPod(pod.podId);
      }
    }
  }

  /**
   * 获取指标
   */
  getMetrics(): ServiceMetrics {
    let totalPods = 0;
    let runningPods = 0;
    let busyPods = 0;
    let idlePods = 0;

    for (const pod of this.pods.values()) {
      totalPods++;
      const info = pod.getInfo();
      if (info.status === 'running' || info.status === 'idle' || info.status === 'busy') {
        runningPods++;
      }
      if (info.status === 'busy') {
        busyPods++;
      }
      if (info.status === 'idle') {
        idlePods++;
      }
    }

    // 计算响应时间
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const avg = sortedTimes.length > 0
      ? sortedTimes.reduce((sum, t) => sum + t, 0) / sortedTimes.length
      : 0;
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95 = sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0;

    return {
      pods: {
        total: totalPods,
        running: runningPods,
        busy: busyPods,
        idle: idlePods,
      },
      queueLength: this.queue.length,
      responseTime: {
        avg,
        p95,
      },
      rps: 0, // TODO: 实现 RPS 计算
      errorRate: this.totalRequests > 0 ? this.failedRequests / this.totalRequests : 0,
      crashCount: this.crashCount,
      totalRequests: this.totalRequests,
      maxPods: this.config.maxPods,
    };
  }

  /**
   * 销毁服务
   */
  async destroy(options?: DestroyOptions): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    // 停止空闲检查
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }

    // 清空队列
    for (const queuedRequest of this.queue) {
      if (queuedRequest.timeout) {
        clearTimeout(queuedRequest.timeout);
      }
      queuedRequest.reject(new Error('Service closed'));
    }
    this.queue = [];

    if (options?.force) {
      // 强制关闭所有 Pod
      for (const pod of this.pods.values()) {
        pod.kill('SIGKILL');
      }
      this.pods.clear();
    } else {
      // 优雅关闭：等待所有 Pod 空闲
      const timeout = options?.timeout || 30000;
      const startTime = Date.now();

      while (this.pods.size > 0) {
        if (Date.now() - startTime > timeout) {
          // 超时，强制关闭
          for (const pod of this.pods.values()) {
            pod.kill('SIGKILL');
          }
          this.pods.clear();
          break;
        }

        // 检查是否所有 Pod 都空闲
        let allIdle = true;
        for (const pod of this.pods.values()) {
          if (!pod.isIdle()) {
            allIdle = false;
            break;
          }
        }

        if (allIdle) {
          // 所有 Pod 都空闲，关闭它们
          for (const pod of this.pods.values()) {
            pod.kill();
          }
          this.pods.clear();
          break;
        }

        // 等待一段时间
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}
