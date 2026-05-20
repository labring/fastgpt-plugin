import { randomUUID } from 'node:crypto';

import { PluginPod } from '../pod';
import type { PodStats } from '../types';

import type { ServiceRuntimeOptions } from './types';

const MAX_CONSECUTIVE_POD_STARTUP_FAILURES = 3;

export class PodFleet {
  private pods = new Map<string, PluginPod>();
  private retiringPods = new Set<string>();
  private pendingPods = 0;
  private consecutivePodStartupFailures = 0;
  private podStartupDisabledError: Error | null = null;

  constructor(private readonly options: ServiceRuntimeOptions) {}

  get size(): number {
    return this.pods.size;
  }

  get pending(): number {
    return this.pendingPods;
  }

  get totalIncludingPending(): number {
    return this.pods.size + this.pendingPods;
  }

  values(): PluginPod[] {
    return [...this.pods.values()];
  }

  hasPod(podId: string): boolean {
    return this.pods.has(podId);
  }

  isRetiring(podId: string): boolean {
    return this.retiringPods.has(podId);
  }

  async ensureMinPods(): Promise<void> {
    const config = this.options.getConfig();
    const target = Math.min(config.minPods, config.maxPods);
    const creates: Promise<PluginPod>[] = [];

    while (this.totalIncludingPending < target && this.canScaleUp()) {
      creates.push(this.createPod());
    }

    await Promise.allSettled(creates);
    this.options.onPodStartupBlocked();
  }

  canScaleUp(): boolean {
    const config = this.options.getConfig();
    return !this.podStartupDisabledError && this.totalIncludingPending < config.maxPods;
  }

  async createPod(): Promise<PluginPod> {
    if (this.podStartupDisabledError) {
      throw this.podStartupDisabledError;
    }
    if (!this.canScaleUp()) {
      throw new Error('Pod capacity reached');
    }

    const podId = randomUUID();
    const config = this.options.getConfig();
    const pod = new PluginPod(podId, {
      pluginPath: this.options.pluginPath,
      podTimeout: config.podTimeout,
      maxRequests: config.maxRequestsPerPod,
      maxConcurrentRequests: config.maxConcurrentRequestsPerPod,
      pluginPermissions: this.options.pluginPermissions,
      getInvokeSession: this.options.getInvokeSession,
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
          this.options.callbacks.onPodLog?.({ podId, level: 'debug', message: line });
        },
        onStderr: (line: string) => {
          this.options.callbacks.onPodLog?.({ podId, level: 'error', message: line });
        }
      }
    });

    this.pendingPods++;
    try {
      await pod.start();
      this.recordPodStartupSuccess();
      this.pods.set(podId, pod);
      this.options.callbacks.onPodCreated?.();
      return pod;
    } catch (error) {
      const startupError = toError(error);
      this.recordPodStartupFailure(startupError);
      throw this.podStartupDisabledError ?? startupError;
    } finally {
      this.pendingPods--;
    }
  }

  selectAvailablePod(): PluginPod | null {
    const candidates = this.values().filter(
      (pod) => !this.retiringPods.has(pod.podId) && pod.isAvailable()
    );

    candidates.sort(comparePodLoad);
    return candidates[0] ?? null;
  }

  shouldRecycle(pod: PluginPod): boolean {
    const info = pod.getInfo();
    const maxRequests = this.options.getConfig().maxRequestsPerPod;

    return (
      this.retiringPods.has(pod.podId) ||
      info.status === 'failed' ||
      info.status === 'terminating' ||
      (maxRequests > 0 && info.requestsExecuted >= maxRequests)
    );
  }

  recyclePod(pod: PluginPod): void {
    this.destroyPod(pod.podId);
  }

  destroyPod(podId: string, signal: NodeJS.Signals = 'SIGTERM'): void {
    const pod = this.pods.get(podId);
    if (!pod) {
      return;
    }

    this.retiringPods.delete(podId);
    pod.kill(signal);
    this.pods.delete(podId);
  }

  updateMaxConcurrentRequests(maxConcurrentRequests: number): void {
    for (const pod of this.pods.values()) {
      pod.updateMaxConcurrentRequests(maxConcurrentRequests);
    }
  }

  trimIdlePods(): void {
    const config = this.options.getConfig();
    const idlePods = this.values()
      .filter((pod) => pod.isIdle() && pod.getIdleTime() > config.idleTimeout)
      .sort(comparePodRetirementPriority);

    for (const pod of idlePods) {
      if (this.pods.size <= config.minPods) {
        break;
      }
      this.destroyPod(pod.podId);
    }
  }

  enforceMaxPods(): void {
    const config = this.options.getConfig();
    if (this.pods.size <= config.maxPods) {
      return;
    }

    const overflow = this.pods.size - config.maxPods;
    const candidates = this.values().sort(comparePodRetirementPriority).slice(0, overflow);

    for (const pod of candidates) {
      this.retiringPods.add(pod.podId);
      if (pod.isIdle()) {
        this.destroyPod(pod.podId);
      }
    }
  }

  async rollPods(): Promise<void> {
    const rollingPods = this.values();

    for (const pod of rollingPods) {
      if (!this.pods.has(pod.podId) || this.options.isDestroyed()) {
        continue;
      }

      this.retiringPods.add(pod.podId);

      if (this.canScaleUp()) {
        try {
          await this.createPod();
        } catch (error) {
          console.error(
            `[${this.options.serviceName}] Failed to create rolling replacement:`,
            error
          );
          this.options.onPodStartupBlocked();
          continue;
        }
      }

      if (pod.isIdle()) {
        this.destroyPod(pod.podId);
        continue;
      }

      if (this.totalIncludingPending < this.options.getConfig().minPods) {
        await this.ensureMinPods();
      }
    }
  }

  getStartupBlockedError(): Error | null {
    if (!this.podStartupDisabledError) {
      return null;
    }
    if (this.pods.size > 0 || this.pendingPods > 0) {
      return null;
    }
    return this.podStartupDisabledError;
  }

  getStats(): PodStats {
    let running = 0;
    let busy = 0;
    let idle = 0;

    for (const pod of this.pods.values()) {
      const info = pod.getInfo();
      if (info.status === 'running' || info.status === 'idle') {
        running++;
      }
      if (info.activeRequests > 0) {
        busy++;
      }
      if (info.status === 'idle' && info.activeRequests === 0) {
        idle++;
      }
    }

    return {
      total: this.pods.size,
      running,
      busy,
      idle,
      pending: this.pendingPods
    };
  }

  async destroy(options?: { force?: boolean; timeout?: number }): Promise<void> {
    this.retiringPods.clear();

    if (options?.force) {
      for (const pod of this.pods.values()) {
        pod.kill('SIGKILL');
      }
      this.pods.clear();
      return;
    }

    const timeout = options?.timeout ?? 30_000;
    const startedAt = Date.now();

    while (this.pods.size > 0) {
      if (Date.now() - startedAt > timeout) {
        for (const pod of this.pods.values()) {
          pod.kill('SIGKILL');
        }
        this.pods.clear();
        return;
      }

      const pods = this.values();
      if (pods.every((pod) => pod.isIdle())) {
        for (const pod of pods) {
          this.destroyPod(pod.podId);
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async replaceIdlePod(pod: PluginPod): Promise<void> {
    if (!this.pods.has(pod.podId)) {
      return;
    }

    if (this.canScaleUp()) {
      try {
        await this.createPod();
        this.destroyPod(pod.podId);
        return;
      } catch (error) {
        console.error(`[${this.options.serviceName}] Failed to create rolling replacement:`, error);
        this.options.onPodStartupBlocked();
        return;
      }
    }

    this.destroyPod(pod.podId);
    await this.ensureMinPods();
  }

  private handlePodError(pod: PluginPod, error: Error): void {
    console.error(`Pod ${pod.podId} error:`, error);
  }

  private handlePodExit(
    pod: PluginPod,
    _code: number | null,
    _signal: string | null,
    wasRunning: boolean
  ): void {
    this.pods.delete(pod.podId);
    this.retiringPods.delete(pod.podId);

    if (wasRunning) {
      this.options.onPodCrashed();
    }

    if (!this.options.isDestroyed()) {
      void this.ensureMinPods().finally(() => {
        this.options.onPodChanged();
      });
    }

    this.options.onPodChanged();
  }

  private handlePodTimeout(pod: PluginPod, _requestId: string, method: string): void {
    console.error(`Pod ${pod.podId} request timeout: ${method}`);
  }

  private recordPodStartupSuccess(): void {
    this.consecutivePodStartupFailures = 0;
    this.podStartupDisabledError = null;
  }

  private recordPodStartupFailure(error: Error): void {
    this.consecutivePodStartupFailures++;
    console.error(
      `[${this.options.serviceName}] Pod startup failed (${this.consecutivePodStartupFailures}/${MAX_CONSECUTIVE_POD_STARTUP_FAILURES})`,
      error
    );

    if (this.consecutivePodStartupFailures < MAX_CONSECUTIVE_POD_STARTUP_FAILURES) {
      return;
    }

    this.podStartupDisabledError = new Error(
      `[${this.options.serviceName}] Pod startup failed ${this.consecutivePodStartupFailures} times consecutively; pod creation has been disabled`
    );
    console.error(this.podStartupDisabledError);
  }
}

function comparePodLoad(a: PluginPod, b: PluginPod): number {
  const aInfo = a.getInfo();
  const bInfo = b.getInfo();

  return (
    aInfo.activeRequests - bInfo.activeRequests ||
    aInfo.requestsExecuted - bInfo.requestsExecuted ||
    aInfo.lastActiveAt - bInfo.lastActiveAt ||
    aInfo.createdAt - bInfo.createdAt ||
    aInfo.podId.localeCompare(bInfo.podId)
  );
}

function comparePodRetirementPriority(a: PluginPod, b: PluginPod): number {
  const aInfo = a.getInfo();
  const bInfo = b.getInfo();

  return (
    Number(b.isIdle()) - Number(a.isIdle()) ||
    bInfo.requestsExecuted - aInfo.requestsExecuted ||
    aInfo.lastActiveAt - bInfo.lastActiveAt
  );
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
