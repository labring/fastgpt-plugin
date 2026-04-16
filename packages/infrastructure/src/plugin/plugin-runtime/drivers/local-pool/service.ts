import { randomUUID } from 'node:crypto';

import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

import { PluginPod } from './pod';
import type {
  DestroyOptions,
  InvokeOptions,
  LocalPoolPluginConfigType as ServiceConfig,
  PluginServiceCallbacks,
  ServiceMetrics
} from './types';
import { LocalPoolPluginConfigSchema } from './types';

const MAX_CONSECUTIVE_POD_STARTUP_FAILURES = 3;

interface QueuedRequest {
  requestId: string;
  method: PluginInvokeEventNameType;
  params: any;
  returnStream: boolean;
  options?: InvokeOptions;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  queuedAt: number;
  timeout?: NodeJS.Timeout;
}

export class PluginService {
  private pods = new Map<string, PluginPod>();
  private queue: QueuedRequest[] = [];
  private activeInvokeSessions = new Map<string, InvokePort>();
  private initialized = false;
  private destroyed = false;
  private idleCheckTimer: NodeJS.Timeout | null = null;
  /** 正在启动中（尚未加入 this.pods）的 Pod 数量，用于防止并发超量创建 */
  private pendingPods = 0;
  /** 连续 Pod 启动失败次数；成功启动后清零 */
  private consecutivePodStartupFailures = 0;
  /** 达到上限后熔断，避免无限重试拉起坏 Pod */
  private podStartupDisabledError: Error | null = null;

  // 统计信息
  private totalRequests = 0;
  private completedRequests = 0;
  private failedRequests = 0;
  private crashCount = 0;
  private responseTimes: number[] = [];

  constructor(
    public readonly serviceName: string,
    private pluginPath: string,
    private config: ServiceConfig,
    private callbacks: PluginServiceCallbacks = {},
    private pluginPermissions: PluginPermissionEnumType[] = []
  ) {
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    LocalPoolPluginConfigSchema.parse(this.config);
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
  async invoke<P, R, S extends boolean>({
    eventName,
    payload,
    returnStream,
    options
  }: {
    eventName: PluginInvokeEventNameType;
    payload: P;
    returnStream: S;
    options?: InvokeOptions;
  }): Promise<S extends true ? StreamData<R> : R> {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    if (this.destroyed) {
      throw new Error('Service already closed');
    }

    this.totalRequests++;
    const startTime = Date.now();
    const resolvedOptions = this.resolveInvokeOptions(options);

    // 尝试立即获取可用的 Pod
    let pod = this.findIdlePod();

    // 如果没有空闲 Pod，尝试创建新 Pod
    if (!pod && this.pods.size + this.pendingPods < this.config.maxPods) {
      this.pendingPods++;
      try {
        pod = await this.createPod();
      } catch (error) {
        // 创建失败，继续排队
        console.error(`[${this.serviceName}] Failed to create pod, queuing request:`, error);
      } finally {
        this.pendingPods--;
      }
    }

    // 如果有可用 Pod，直接执行
    if (pod) {
      try {
        const result = await pod.invoke<P, R, S>({
          eventName,
          payload,
          returnStream,
          options: resolvedOptions
        });

        // 记录响应时间
        const duration = Date.now() - startTime;
        this.responseTimes.push(duration);
        if (this.responseTimes.length > 1000) {
          this.responseTimes.shift();
        }

        this.completedRequests++;
        this.callbacks.onRequestCompleted?.({ requestId: randomUUID(), duration });

        // 释放 Pod
        this.releasePod(pod);

        this.bindInvokeSessionLifecycle(resolvedOptions?.invocationId, result);

        return result as S extends true ? StreamData<R> : R;
      } catch (error) {
        this.failedRequests++;
        this.callbacks.onRequestFailed?.({ requestId: randomUUID(), error });

        // 释放 Pod
        this.releasePod(pod);
        this.cleanupInvokeSession(resolvedOptions?.invocationId);

        throw error;
      }
    }

    const startupBlockedError = this.getPodStartupBlockedError();
    if (startupBlockedError) {
      this.failedRequests++;
      this.cleanupInvokeSession(resolvedOptions?.invocationId);
      throw startupBlockedError;
    }

    // 没有可用 Pod，排队等待
    return this.queueAndWait(
      eventName,
      payload,
      returnStream,
      resolvedOptions,
      startTime
    ) as Promise<S extends true ? StreamData<R> : R>;
  }

  /**
   * 排队并等待执行
   */
  private queueAndWait(
    method: PluginInvokeEventNameType,
    params: any,
    returnStream: boolean,
    options: InvokeOptions | undefined,
    startTime: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 检查队列是否已满
      if (this.queue.length >= this.config.maxQueueSize) {
        this.failedRequests++;
        this.cleanupInvokeSession(options?.invocationId);
        reject(new Error('Queue is full'));
        return;
      }

      const requestId = randomUUID();
      const queueTimeout = this.config.queueTimeout || 30000;

      // 设置队列等待超时
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex((r) => r.requestId === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        this.failedRequests++;
        this.cleanupInvokeSession(options?.invocationId);
        reject(new Error('Queue wait timeout'));
      }, queueTimeout);

      const queuedRequest: QueuedRequest = {
        requestId,
        method,
        params,
        returnStream,
        options,
        resolve: async (pod: PluginPod) => {
          try {
            const result = await pod.invoke({
              eventName: method,
              payload: params,
              returnStream,
              options
            });

            // 记录响应时间
            const duration = Date.now() - startTime;
            this.responseTimes.push(duration);
            if (this.responseTimes.length > 1000) {
              this.responseTimes.shift();
            }

            this.completedRequests++;
            this.callbacks.onRequestCompleted?.({ requestId, duration });

            // 释放 Pod
            this.releasePod(pod);

            this.bindInvokeSessionLifecycle(options?.invocationId, result);

            resolve(result);
          } catch (error) {
            this.failedRequests++;
            this.callbacks.onRequestFailed?.({ requestId, error });

            // 释放 Pod
            this.releasePod(pod);
            this.cleanupInvokeSession(options?.invocationId);

            reject(error);
          }
        },
        reject,
        queuedAt: Date.now(),
        timeout
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
    if (this.podStartupDisabledError) {
      return Promise.reject(this.podStartupDisabledError);
    }

    const podId = randomUUID();
    const pod = new PluginPod(podId, {
      pluginPath: this.pluginPath,
      podTimeout: this.config.podTimeout,
      maxRequests: this.config.maxRequestsPerPod,
      maxConcurrentRequests: this.config.maxConcurrentRequestsPerPod,
      pluginPermissions: this.pluginPermissions,
      getInvokeSession: (invocationId?: string) =>
        invocationId ? this.activeInvokeSessions.get(invocationId) : undefined,
      callbacks: {
        onError: (error: Error) => {
          this.handlePodError(pod, error);
        },
        onExit: ({ code, signal, wasRunning }) => {
          this.handlePodExit(pod, code, signal, wasRunning);
        },
        onTimeout: ({ requestId, method }) => {
          this.handlePodTimeout(pod, requestId, method);
        },
        onStdout: (line: string) => {
          this.callbacks.onPodLog?.({ podId, level: 'debug', message: line });
        },
        onStderr: (line: string) => {
          this.callbacks.onPodLog?.({ podId, level: 'error', message: line });
        }
      }
    });

    try {
      // 启动 Pod
      await pod.start();
    } catch (error) {
      const startupError = toError(error);
      this.recordPodStartupFailure(startupError);
      return Promise.reject(this.podStartupDisabledError ?? startupError);
    }

    this.recordPodStartupSuccess();
    this.pods.set(podId, pod);
    this.callbacks.onPodCreated?.();

    return pod;
  }

  private resolveInvokeOptions(options?: InvokeOptions): InvokeOptions | undefined {
    if (!options?.invoke) {
      return options;
    }

    const invocationId = options.invocationId ?? randomUUID();
    this.activeInvokeSessions.set(invocationId, options.invoke);

    return {
      ...options,
      invocationId
    };
  }

  private bindInvokeSessionLifecycle(invocationId: string | undefined, result: unknown) {
    if (!invocationId) {
      return;
    }

    if (result instanceof StreamData) {
      const cleanup = () => {
        this.cleanupInvokeSession(invocationId);
      };
      result.onEnd(cleanup).onError(cleanup);
      return;
    }

    this.cleanupInvokeSession(invocationId);
  }

  private cleanupInvokeSession(invocationId?: string) {
    if (!invocationId) {
      return;
    }

    this.activeInvokeSessions.delete(invocationId);
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
          this.rejectQueuedRequestsIfPodStartupDisabled();
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
        if (this.podStartupDisabledError && this.pods.size === 0 && this.pendingPods === 0) {
          this.rejectQueuedRequestsIfPodStartupDisabled();
        }

        // 队列有请求但没有空闲 Pod，若未达上限则触发扩容
        if (
          !this.podStartupDisabledError &&
          this.pods.size + this.pendingPods < this.config.maxPods
        ) {
          this.pendingPods++;
          this.createPod()
            .then((pod) => {
              this.pendingPods--;
              // 新 pod 就绪后再次处理队列
              this.processQueue();
            })
            .catch(() => {
              this.pendingPods--;
              this.rejectQueuedRequestsIfPodStartupDisabled();
            });
        }
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
  }

  /**
   * 处理 Pod 退出
   */
  private handlePodExit(
    pod: PluginPod,
    code: number | null,
    signal: string | null,
    wasRunning: boolean
  ): void {
    this.pods.delete(pod.podId);

    if (wasRunning) {
      this.crashCount++;
    }

    // 如果低于最小数量，自动补充
    if (this.pods.size < this.config.minPods && !this.destroyed) {
      this.createPod().catch((error) => {
        console.error('Failed to auto-replenish Pod:', error);
        this.rejectQueuedRequestsIfPodStartupDisabled();
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
        this.rejectQueuedRequestsIfPodStartupDisabled();
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

  private recordPodStartupSuccess(): void {
    this.consecutivePodStartupFailures = 0;
    this.podStartupDisabledError = null;
  }

  private recordPodStartupFailure(error: Error): void {
    this.consecutivePodStartupFailures += 1;
    console.error(
      `[${this.serviceName}] Pod startup failed (${this.consecutivePodStartupFailures}/${MAX_CONSECUTIVE_POD_STARTUP_FAILURES})`,
      error
    );

    if (this.consecutivePodStartupFailures < MAX_CONSECUTIVE_POD_STARTUP_FAILURES) {
      return;
    }

    this.podStartupDisabledError = new Error(
      `[${this.serviceName}] Pod startup failed ${this.consecutivePodStartupFailures} times consecutively; pod creation has been disabled`
    );
    console.error(this.podStartupDisabledError);
  }

  private getPodStartupBlockedError(): Error | null {
    if (!this.podStartupDisabledError) {
      return null;
    }

    if (this.pods.size > 0 || this.pendingPods > 0) {
      return null;
    }

    return this.podStartupDisabledError;
  }

  private rejectQueuedRequestsIfPodStartupDisabled(): void {
    const error = this.getPodStartupBlockedError();
    if (!error) {
      return;
    }

    while (this.queue.length > 0) {
      const queuedRequest = this.queue.shift();
      if (!queuedRequest) {
        break;
      }

      if (queuedRequest.timeout) {
        clearTimeout(queuedRequest.timeout);
      }

      this.failedRequests++;
      this.cleanupInvokeSession(queuedRequest.options?.invocationId);
      queuedRequest.reject(error);
    }
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
      if (info.status === 'running' || info.status === 'idle') {
        runningPods++;
      }
      if (info.activeRequests > 0) {
        busyPods++;
      }
      if (info.status === 'idle' && info.activeRequests === 0) {
        idlePods++;
      }
    }

    // 计算响应时间
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const avg =
      sortedTimes.length > 0 ? sortedTimes.reduce((sum, t) => sum + t, 0) / sortedTimes.length : 0;
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95 = sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0;

    return {
      pods: {
        total: totalPods,
        running: runningPods,
        busy: busyPods,
        idle: idlePods,
        pending: this.pendingPods
      },
      queueLength: this.queue.length,
      responseTime: {
        avg,
        p95
      },
      rps: 0, // TODO: 实现 RPS 计算
      errorRate: this.totalRequests > 0 ? this.failedRequests / this.totalRequests : 0,
      crashCount: this.crashCount,
      totalRequests: this.totalRequests,
      maxPods: this.config.maxPods,
      minPods: this.config.minPods
    };
  }

  /**
   * 即时更新服务配置
   * - maxConcurrentRequestsPerPod：对所有现有 Pod 立即生效
   * - minPods 增加：立即补充 Pod 到新下限
   * - minPods 减少 / maxPods 变更：更新上下限，下次空闲检查/创建时生效
   */
  async updateConfig(
    partial: Partial<Pick<ServiceConfig, 'minPods' | 'maxPods' | 'maxConcurrentRequestsPerPod'>>
  ): Promise<void> {
    if (partial.minPods !== undefined) this.config.minPods = partial.minPods;
    if (partial.maxPods !== undefined) this.config.maxPods = partial.maxPods;

    if (partial.maxConcurrentRequestsPerPod !== undefined) {
      this.config.maxConcurrentRequestsPerPod = partial.maxConcurrentRequestsPerPod;
      // 对所有现有 Pod 即时生效
      for (const pod of this.pods.values()) {
        pod.updateMaxConcurrentRequests(partial.maxConcurrentRequestsPerPod);
      }
    }

    // 若新 minPods 大于当前 Pod 数，立即补充
    if (this.config.minPods > this.pods.size + this.pendingPods) {
      const needed = this.config.minPods - this.pods.size - this.pendingPods;
      const creates: Promise<PluginPod>[] = [];
      for (let i = 0; i < needed; i++) {
        this.pendingPods++;
        creates.push(
          this.createPod().finally(() => {
            this.pendingPods--;
          })
        );
      }
      await Promise.allSettled(creates);
    }
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
      this.cleanupInvokeSession(queuedRequest.options?.invocationId);
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}
