import { randomUUID } from 'node:crypto';

import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

import type { PluginPod } from '../pod';
import type {
  DestroyOptions,
  InvokeOptions,
  LocalPoolPluginConfigType as ServiceConfig,
  PluginServiceCallbacks,
  ServiceMetrics
} from '../types';
import { LocalPoolPluginConfigSchema } from '../types';

import { PodFleet } from './pod-fleet';
import { createServiceRequest } from './request';
import { RequestQueue } from './request-queue';
import { ServiceStats } from './stats';
import type { ServiceRequest } from './types';

export class PluginService {
  private config: ServiceConfig;
  private readonly fleet: PodFleet;
  private readonly queue: RequestQueue;
  private readonly stats = new ServiceStats();
  private readonly activeInvokeSessions = new Map<string, InvokePort>();
  private initialized = false;
  private destroyed = false;
  private idleCheckTimer: NodeJS.Timeout | null = null;

  constructor(
    public readonly serviceName: string,
    private readonly pluginPath: string,
    config: ServiceConfig,
    private readonly callbacks: PluginServiceCallbacks = {},
    private readonly pluginPermissions: PluginPermissionEnumType[] = []
  ) {
    this.config = this.validateConfig(config);
    this.fleet = new PodFleet({
      serviceName,
      pluginPath,
      getConfig: () => this.config,
      callbacks,
      pluginPermissions,
      getInvokeSession: (invocationId?: string) =>
        invocationId ? this.activeInvokeSessions.get(invocationId) : undefined,
      isDestroyed: () => this.destroyed,
      onPodCrashed: () => {
        this.stats.recordCrash();
      },
      onPodChanged: () => {
        this.processQueue();
      },
      onPodStartupBlocked: () => {
        this.rejectQueuedRequestsIfPodStartupDisabled();
      }
    });
    this.queue = new RequestQueue({
      maxSize: () => this.config.maxQueueSize,
      timeoutMs: () => this.config.queueTimeout,
      onTimeout: (request) => {
        this.stats.recordFailed();
        this.cleanupInvokeSession(request.options?.invocationId);
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Service already initialized');
    }
    if (this.destroyed) {
      throw new Error('Service already destroyed');
    }

    await this.fleet.ensureMinPods();
    this.startIdleCheck();
    this.initialized = true;
  }

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
    this.assertReady();
    this.stats.recordRequest();

    const startedAt = Date.now();
    const resolvedOptions = this.resolveInvokeOptions(options);
    const pod = await this.acquirePodForImmediateInvoke();

    if (pod) {
      const { request, promise } = createServiceRequest({
        eventName,
        payload,
        returnStream,
        options: resolvedOptions,
        startedAt
      });
      this.executeRequest(request, pod);
      return promise as Promise<S extends true ? StreamData<R> : R>;
    }

    const startupBlockedError = this.fleet.getStartupBlockedError();
    if (startupBlockedError) {
      this.stats.recordFailed();
      this.cleanupInvokeSession(resolvedOptions?.invocationId);
      throw startupBlockedError;
    }

    return this.queueAndWait({
      eventName,
      payload,
      returnStream,
      options: resolvedOptions,
      startedAt
    }) as Promise<S extends true ? StreamData<R> : R>;
  }

  getMetrics(): ServiceMetrics {
    return this.stats.toMetrics(this.fleet.getStats(), this.queue.length, this.config);
  }

  async updateConfig(partial: Partial<ServiceConfig>): Promise<void> {
    const previous = this.config;
    const next = this.validateConfig({
      ...this.config,
      ...partial
    });

    this.config = next;

    if (previous.maxConcurrentRequestsPerPod !== next.maxConcurrentRequestsPerPod) {
      this.fleet.updateMaxConcurrentRequests(next.maxConcurrentRequestsPerPod);
    }

    await this.fleet.ensureMinPods();

    if (shouldRollPods(previous, next)) {
      await this.fleet.rollPods();
    }

    this.fleet.enforceMaxPods();
    this.fleet.trimIdlePods();
    this.processQueue();
  }

  async destroy(options?: DestroyOptions): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }

    this.queue.rejectAll(new Error('Service closed'), (request) => {
      this.cleanupInvokeSession(request.options?.invocationId);
    });
    this.activeInvokeSessions.clear();

    await this.fleet.destroy(options);
  }

  private validateConfig(config: ServiceConfig): ServiceConfig {
    return LocalPoolPluginConfigSchema.parse(config);
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    if (this.destroyed) {
      throw new Error('Service already closed');
    }
  }

  private async acquirePodForImmediateInvoke(): Promise<PluginPod | null> {
    const availablePod = this.fleet.selectAvailablePod();
    if (availablePod) {
      return availablePod;
    }

    if (!this.fleet.canScaleUp()) {
      return null;
    }

    try {
      return await this.fleet.createPod();
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to create pod, queuing request:`, error);
      this.rejectQueuedRequestsIfPodStartupDisabled();
      return null;
    }
  }

  private queueAndWait(input: Parameters<typeof createServiceRequest>[0]): Promise<unknown> {
    try {
      const promise = this.queue.enqueue(input);
      this.processQueue();
      return promise;
    } catch (error) {
      this.stats.recordFailed();
      this.cleanupInvokeSession(input.options?.invocationId);
      return Promise.reject(error);
    }
  }

  private processQueue(): void {
    if (this.destroyed) {
      return;
    }

    while (this.queue.length > 0) {
      const pod = this.fleet.selectAvailablePod();
      if (!pod) {
        this.rejectQueuedRequestsIfPodStartupDisabled();
        this.scaleUpForQueuedWork();
        return;
      }

      const request = this.queue.shift();
      if (!request) {
        return;
      }

      this.executeRequest(request, pod);
    }
  }

  private scaleUpForQueuedWork(): void {
    if (!this.fleet.canScaleUp()) {
      return;
    }

    void this.fleet
      .createPod()
      .then(() => {
        this.processQueue();
      })
      .catch(() => {
        this.rejectQueuedRequestsIfPodStartupDisabled();
      });
  }

  private executeRequest(request: ServiceRequest, pod: PluginPod): void {
    void this.runRequest(request, pod);
  }

  private async runRequest(request: ServiceRequest, pod: PluginPod): Promise<void> {
    try {
      const result = await pod.invoke({
        eventName: request.eventName,
        payload: request.payload,
        returnStream: request.returnStream,
        options: request.options
      });

      const duration = Date.now() - request.startedAt;
      this.stats.recordCompleted(duration);
      this.callbacks.onRequestCompleted?.({ requestId: request.requestId, duration });
      this.releasePod(pod);
      this.bindInvokeSessionLifecycle(request.options?.invocationId, result);
      request.resolve(result);
    } catch (error) {
      const normalizedError = toError(error);
      this.stats.recordFailed();
      this.callbacks.onRequestFailed?.({ requestId: request.requestId, error });
      this.releasePod(pod);
      this.cleanupInvokeSession(request.options?.invocationId);
      request.reject(normalizedError);
    }
  }

  private releasePod(pod: PluginPod): void {
    if (this.destroyed) {
      return;
    }

    if (this.fleet.hasPod(pod.podId) && this.fleet.shouldRecycle(pod)) {
      this.fleet.recyclePod(pod);
      void this.fleet.ensureMinPods().finally(() => {
        this.processQueue();
      });
      return;
    }

    this.processQueue();
  }

  private rejectQueuedRequestsIfPodStartupDisabled(): void {
    const error = this.fleet.getStartupBlockedError();
    if (!error) {
      return;
    }

    this.queue.rejectAll(error, (request) => {
      this.stats.recordFailed();
      this.cleanupInvokeSession(request.options?.invocationId);
    });
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

  private bindInvokeSessionLifecycle(invocationId: string | undefined, result: unknown): void {
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

  private cleanupInvokeSession(invocationId?: string): void {
    if (!invocationId) {
      return;
    }
    this.activeInvokeSessions.delete(invocationId);
  }

  private startIdleCheck(): void {
    this.idleCheckTimer = setInterval(() => {
      this.fleet.trimIdlePods();
    }, 5000);
  }
}

function shouldRollPods(previous: ServiceConfig, next: ServiceConfig): boolean {
  return (
    previous.podTimeout !== next.podTimeout || previous.maxRequestsPerPod !== next.maxRequestsPerPod
  );
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
