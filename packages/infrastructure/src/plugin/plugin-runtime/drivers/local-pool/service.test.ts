import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StreamData } from '@domain/value-objects/stream.vo';

import { PluginService } from './service/index';
import type { LocalPoolServiceConfigType } from './types';

const podMock = vi.hoisted(() => ({
  startupTimeoutCode: 'POD_STARTUP_TIMEOUT',
  pods: [] as any[],
  startErrors: [] as Error[],
  invokeHandlers: [] as Array<(args: any) => unknown>,
  reset() {
    this.pods.length = 0;
    this.startErrors.length = 0;
    this.invokeHandlers.length = 0;
  }
}));

const sdkFactoryRuntimeMock = vi.hoisted(() => ({
  ensureSdkFactoryRuntimeDependency: vi.fn()
}));

const runtimeMetricsMock = vi.hoisted(() => ({
  recorder: {
    recordInvocationStarted: vi.fn(),
    recordInvocationCompleted: vi.fn(),
    recordInvocationFailed: vi.fn(),
    recordPodCrash: vi.fn(),
    recordPodStartup: vi.fn()
  }
}));

vi.mock('./sdk-factory-runtime', () => sdkFactoryRuntimeMock);
vi.mock('@infrastructure/metrics', () => ({
  getRuntimeMetrics: () => runtimeMetricsMock.recorder
}));

vi.mock('./pod', () => {
  class PluginPod {
    public status = 'pending';
    public requestsExecuted = 0;
    public activeRequests = 0;
    public createdAt = Date.now();
    public lastActiveAt = Date.now();
    public killedWith: NodeJS.Signals | undefined;
    private maxConcurrentRequests: number;

    constructor(
      public readonly podId: string,
      private readonly options: any
    ) {
      this.maxConcurrentRequests = options.maxConcurrentRequests;
      podMock.pods.push(this);
    }

    async start(): Promise<void> {
      const error = podMock.startErrors.shift();
      if (error) {
        this.status = 'failed';
        throw error;
      }
      this.status = 'idle';
    }

    async invoke(args: any): Promise<unknown> {
      if (!this.isAvailable()) {
        throw new Error(`Pod not available: ${this.status}`);
      }

      this.activeRequests++;
      this.status = 'running';
      this.lastActiveAt = Date.now();

      try {
        const handler = podMock.invokeHandlers.shift();
        const result = handler ? await handler({ pod: this, ...args }) : args.payload;
        this.requestsExecuted++;
        return result;
      } catch (error) {
        this.status = 'failed';
        throw error;
      } finally {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.lastActiveAt = Date.now();
        if (this.status === 'running') {
          this.status = this.activeRequests > 0 ? 'running' : 'idle';
        }
      }
    }

    kill(signal: NodeJS.Signals = 'SIGTERM'): void {
      this.killedWith = signal;
      this.status = 'terminating';
    }

    completeStreamRequest(): void {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.lastActiveAt = Date.now();
      if (this.status === 'running') {
        this.status = this.activeRequests > 0 ? 'running' : 'idle';
      }
    }

    getInfo() {
      return {
        podId: this.podId,
        status: this.status,
        requestsExecuted: this.requestsExecuted,
        activeRequests: this.activeRequests,
        createdAt: this.createdAt,
        lastActiveAt: this.lastActiveAt
      };
    }

    isIdle(): boolean {
      return this.status === 'idle' && this.activeRequests === 0;
    }

    isBusy(): boolean {
      return this.activeRequests > 0;
    }

    isAvailable(): boolean {
      return (
        (this.status === 'idle' || this.status === 'running') &&
        this.activeRequests < this.maxConcurrentRequests &&
        this.requestsExecuted < this.options.maxRequests
      );
    }

    getIdleTime(): number {
      return this.isIdle() ? Date.now() - this.lastActiveAt : 0;
    }

    updateMaxConcurrentRequests(n: number): void {
      this.maxConcurrentRequests = n;
    }
  }

  return {
    PluginPod,
    POD_STARTUP_TIMEOUT_CODE: podMock.startupTimeoutCode,
    isPodStartupTimeoutError: (error: unknown) =>
      error instanceof Error &&
      'code' in error &&
      (error as Error & { code?: string }).code === podMock.startupTimeoutCode
  };
});

const baseConfig: LocalPoolServiceConfigType = {
  minPods: 1,
  maxPods: 1,
  idleTimeout: 1000,
  podTimeout: 1000,
  maxRequestsPerPod: 100,
  maxConcurrentRequestsPerPod: 1,
  maxQueueSize: 10,
  queueTimeout: 1000,
  startupRetryBaseDelay: 1000,
  startupRetryMaxDelay: 10000
};

function makeConfig(
  overrides: Partial<LocalPoolServiceConfigType> = {}
): LocalPoolServiceConfigType {
  return {
    ...baseConfig,
    ...overrides
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

function createStartupTimeoutError(): Error {
  return Object.assign(new Error('Pod startup timeout'), {
    code: podMock.startupTimeoutCode
  });
}

async function waitFor(assertion: () => void, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  if (lastError) {
    throw lastError;
  }
}

const services: PluginService[] = [];

function createService(
  config: LocalPoolServiceConfigType,
  callbacks?: ConstructorParameters<typeof PluginService>[3]
) {
  const service = new PluginService('test-service', '/virtual/plugin.js', config, callbacks);
  services.push(service);
  return service;
}

describe('PluginService', () => {
  beforeEach(() => {
    podMock.reset();
    vi.clearAllMocks();
    sdkFactoryRuntimeMock.ensureSdkFactoryRuntimeDependency.mockReset();
    sdkFactoryRuntimeMock.ensureSdkFactoryRuntimeDependency.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await Promise.allSettled(services.splice(0).map((service) => service.destroy({ force: true })));
    vi.useRealTimers();
    podMock.reset();
  });

  it('creates minPods on initialize and records a successful invoke', async () => {
    const service = createService(makeConfig({ minPods: 2, maxPods: 2 }));

    await service.initialize();

    expect(sdkFactoryRuntimeMock.ensureSdkFactoryRuntimeDependency).toHaveBeenCalledWith({
      pluginIndexPath: '/virtual/plugin.js'
    });

    const result = await service.invoke({
      eventName: 'run',
      payload: { value: 1 },
      returnStream: false
    });

    expect(result).toEqual({ value: 1 });
    expect(podMock.pods).toHaveLength(2);
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 2,
        idle: 2
      },
      totalRequests: 1,
      errorRate: 0
    });
    expect(runtimeMetricsMock.recorder.recordInvocationStarted).toHaveBeenCalledWith({
      runtimeMode: 'localPool',
      pluginId: undefined,
      pluginVersion: undefined,
      pluginEtag: undefined
    });
    expect(runtimeMetricsMock.recorder.recordInvocationCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeMode: 'localPool',
        pluginId: undefined,
        durationMs: expect.any(Number)
      })
    );
  });

  it('queues requests and drains higher priority work first', async () => {
    const service = createService(makeConfig({ minPods: 1, maxPods: 1, maxQueueSize: 2 }));
    const releaseBusy = createDeferred<string>();
    const executionOrder: string[] = [];

    podMock.invokeHandlers.push(
      ({ payload }) => {
        executionOrder.push(payload.name);
        return releaseBusy.promise;
      },
      ({ payload }) => {
        executionOrder.push(payload.name);
        return payload.name;
      },
      ({ payload }) => {
        executionOrder.push(payload.name);
        return payload.name;
      }
    );

    await service.initialize();

    const busy = service.invoke({
      eventName: 'run',
      payload: { name: 'busy' },
      returnStream: false
    });
    await waitFor(() => expect(service.getMetrics().pods.busy).toBe(1));

    const low = service.invoke({
      eventName: 'run',
      payload: { name: 'low' },
      returnStream: false,
      options: { priority: 0 }
    });
    const high = service.invoke({
      eventName: 'run',
      payload: { name: 'high' },
      returnStream: false,
      options: { priority: 10 }
    });
    await waitFor(() => expect(service.getMetrics().queueLength).toBe(2));

    releaseBusy.resolve('busy-result');

    await expect(busy).resolves.toBe('busy-result');
    await expect(high).resolves.toBe('high');
    await expect(low).resolves.toBe('low');
    expect(executionOrder).toEqual(['busy', 'high', 'low']);
  });

  it('balances work across the least loaded available pods', async () => {
    const service = createService(
      makeConfig({
        minPods: 2,
        maxPods: 2,
        maxConcurrentRequestsPerPod: 2
      })
    );
    const releaseFirst = createDeferred<string>();
    const executionPods: string[] = [];

    podMock.invokeHandlers.push(
      ({ pod }) => {
        executionPods.push(pod.podId);
        return releaseFirst.promise;
      },
      ({ pod, payload }) => {
        executionPods.push(pod.podId);
        return payload.name;
      }
    );

    await service.initialize();

    const first = service.invoke({
      eventName: 'run',
      payload: { name: 'first' },
      returnStream: false
    });
    await waitFor(() => expect(service.getMetrics().pods.busy).toBe(1));

    const second = service.invoke({
      eventName: 'run',
      payload: { name: 'second' },
      returnStream: false
    });

    await expect(second).resolves.toBe('second');
    expect(executionPods[1]).not.toBe(executionPods[0]);

    releaseFirst.resolve('first');
    await expect(first).resolves.toBe('first');
  });

  it('does not assign concurrent requests to a pod before it is marked busy', async () => {
    const service = createService(
      makeConfig({
        minPods: 1,
        maxPods: 50,
        maxQueueSize: 100
      })
    );
    const releaseAll = createDeferred<void>();

    for (let i = 0; i < 50; i++) {
      podMock.invokeHandlers.push(async ({ payload }) => {
        await releaseAll.promise;
        return payload.index;
      });
    }

    await service.initialize();

    const requests = Array.from({ length: 50 }, (_, index) =>
      service.invoke({
        eventName: 'run',
        payload: { index },
        returnStream: false
      })
    );

    await waitFor(() => expect(service.getMetrics().pods.busy).toBe(50));

    releaseAll.resolve();

    await expect(Promise.all(requests)).resolves.toEqual(
      Array.from({ length: 50 }, (_, index) => index)
    );
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 50,
        idle: 50
      },
      queueLength: 0,
      errorRate: 0
    });
  });

  it('drains queued work to a replacement service without interrupting running work', async () => {
    const oldService = createService(makeConfig({ minPods: 1, maxPods: 1, maxQueueSize: 10 }));
    const newService = createService(makeConfig({ minPods: 1, maxPods: 1, maxQueueSize: 10 }));
    const releaseOldRunning = createDeferred<string>();
    const executed: string[] = [];

    podMock.invokeHandlers.push(
      ({ payload }) => {
        executed.push(`old:${payload.name}`);
        return releaseOldRunning.promise;
      },
      ({ payload }) => {
        executed.push(`new:${payload.name}`);
        return payload.name;
      },
      ({ payload }) => {
        executed.push(`new:${payload.name}`);
        return payload.name;
      }
    );

    await oldService.initialize();

    const running = oldService.invoke({
      eventName: 'run',
      payload: { name: 'running' },
      returnStream: false
    });
    await waitFor(() => expect(oldService.getMetrics().pods.busy).toBe(1));

    const queued = oldService.invoke({
      eventName: 'run',
      payload: { name: 'queued' },
      returnStream: false
    });
    await waitFor(() => expect(oldService.getMetrics().queueLength).toBe(1));

    await newService.initialize();
    const drain = oldService.drainTo(newService);

    await expect(queued).resolves.toBe('queued');
    await waitFor(() => expect(newService.getMetrics().queueLength).toBe(0));

    const future = oldService.invoke({
      eventName: 'run',
      payload: { name: 'future' },
      returnStream: false
    });

    await expect(future).resolves.toBe('future');
    expect(executed).toEqual(['old:running', 'new:queued', 'new:future']);

    releaseOldRunning.resolve('running');
    await expect(running).resolves.toBe('running');
    await drain;
    expect(oldService.getMetrics().pods.total).toBe(0);
  });

  it('rejects new work when the queue is full', async () => {
    const service = createService(makeConfig({ minPods: 1, maxPods: 1, maxQueueSize: 1 }));
    const releaseBusy = createDeferred<string>();

    podMock.invokeHandlers.push(
      () => releaseBusy.promise,
      ({ payload }) => payload.name
    );

    await service.initialize();

    const busy = service.invoke({
      eventName: 'run',
      payload: { name: 'busy' },
      returnStream: false
    });
    await waitFor(() => expect(service.getMetrics().pods.busy).toBe(1));

    const queued = service.invoke({
      eventName: 'run',
      payload: { name: 'queued' },
      returnStream: false
    });
    await waitFor(() => expect(service.getMetrics().queueLength).toBe(1));

    await expect(
      service.invoke({
        eventName: 'run',
        payload: { name: 'overflow' },
        returnStream: false
      })
    ).rejects.toThrow('Queue is full');
    expect(runtimeMetricsMock.recorder.recordInvocationFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        failureKind: 'queue_overflow'
      })
    );

    releaseBusy.resolve('busy-result');

    await expect(busy).resolves.toBe('busy-result');
    await expect(queued).resolves.toBe('queued');
    expect(service.getMetrics().errorRate).toBe(1 / 3);
  });

  it('records a queue timeout failure without leaking request identity', async () => {
    vi.useFakeTimers();
    const onRequestFailed = vi.fn();
    const service = createService(
      makeConfig({ minPods: 1, maxPods: 1, maxQueueSize: 1, queueTimeout: 20 }),
      {
        onRequestFailed
      }
    );
    const releaseBusy = createDeferred<string>();

    podMock.invokeHandlers.push(() => releaseBusy.promise);

    await service.initialize();
    void service.invoke({
      eventName: 'run',
      payload: { name: 'busy' },
      returnStream: false
    });
    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => expect(service.getMetrics().pods.busy).toBe(1));

    const queued = service.invoke({
      eventName: 'run',
      payload: { name: 'queued' },
      returnStream: false
    });
    const queuedError = expect(queued).rejects.toThrow('Queue wait timeout');
    await vi.advanceTimersByTimeAsync(20);

    await queuedError;
    expect(runtimeMetricsMock.recorder.recordInvocationFailed).toHaveBeenCalledWith({
      runtimeMode: 'localPool',
      pluginId: undefined,
      pluginVersion: undefined,
      pluginEtag: undefined,
      failureKind: 'queue_timeout'
    });
    expect(onRequestFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        failureKind: 'queue_timeout'
      })
    );

    releaseBusy.resolve('busy-result');
  });

  it('times out a streaming request that does not finish before podTimeout', async () => {
    const onRequestFailed = vi.fn();
    const service = createService(makeConfig({ minPods: 0, maxPods: 1, podTimeout: 20 }), {
      onRequestFailed
    });
    const stream = StreamData.create<string>();

    podMock.invokeHandlers.push(() => stream);

    await service.initialize();

    const result = await service.invoke({
      eventName: 'run',
      payload: { name: 'stream' },
      returnStream: true
    });
    const errorPromise = new Promise<Error>((resolve) => result.onError(resolve));

    await expect(errorPromise).resolves.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      method: 'run'
    });
    expect(podMock.pods[0].killedWith).toBe('SIGTERM');
    expect(onRequestFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'REQUEST_TIMEOUT',
          method: 'run'
        }),
        failureKind: 'pod_invoke_error'
      })
    );
    expect(runtimeMetricsMock.recorder.recordInvocationFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        failureKind: 'pod_invoke_error'
      })
    );
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 0
      },
      totalRequests: 1,
      errorRate: 1
    });
  });

  it('rejects an invoke-triggered startup after pod startup retries are exhausted', async () => {
    const service = createService(
      makeConfig({
        minPods: 0,
        maxPods: 1,
        queueTimeout: 10_000
      })
    );
    podMock.startErrors.push(
      new Error('startup failed 1'),
      new Error('startup failed 2'),
      new Error('startup failed 3')
    );

    await service.initialize();

    await expect(
      service.invoke({
        eventName: 'run',
        payload: { name: 'cold-start' },
        returnStream: false
      })
    ).rejects.toThrow(
      '[test-service] Pod startup failed 3 times consecutively; pod creation has been disabled'
    );
    expect(podMock.pods).toHaveLength(3);
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 0,
        pending: 0
      },
      queueLength: 0,
      totalRequests: 1,
      errorRate: 1
    });
    expect(runtimeMetricsMock.recorder.recordInvocationFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        failureKind: 'startup_blocked'
      })
    );
  });

  it('backs off startup timeouts without disabling pod creation', async () => {
    vi.useFakeTimers();
    const service = createService(
      makeConfig({
        minPods: 0,
        maxPods: 1,
        queueTimeout: 20_000,
        startupRetryBaseDelay: 50,
        startupRetryMaxDelay: 120
      })
    );
    podMock.startErrors.push(
      createStartupTimeoutError(),
      createStartupTimeoutError(),
      createStartupTimeoutError()
    );

    await service.initialize();

    const request = service.invoke({
      eventName: 'run',
      payload: { name: 'cold-start' },
      returnStream: false
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(service.getMetrics().queueLength).toBe(1);
    expect(podMock.pods).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(50);
    expect(service.getMetrics().queueLength).toBe(1);
    expect(podMock.pods).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(service.getMetrics().queueLength).toBe(1);
    expect(podMock.pods).toHaveLength(3);

    await vi.advanceTimersByTimeAsync(120);

    await expect(request).resolves.toEqual({ name: 'cold-start' });
    expect(podMock.pods).toHaveLength(4);
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 1,
        idle: 1,
        pending: 0
      },
      queueLength: 0,
      totalRequests: 1,
      errorRate: 0
    });
  });

  it('resets deterministic startup failure count after a startup timeout', async () => {
    vi.useFakeTimers();
    const service = createService(
      makeConfig({
        minPods: 0,
        maxPods: 1,
        maxRequestsPerPod: 1,
        queueTimeout: 20_000,
        startupRetryBaseDelay: 50,
        startupRetryMaxDelay: 120
      })
    );

    await service.initialize();

    podMock.startErrors.push(new Error('startup failed 1'), createStartupTimeoutError());
    const first = service.invoke({
      eventName: 'run',
      payload: { name: 'first' },
      returnStream: false
    });

    await vi.advanceTimersByTimeAsync(50);
    await expect(first).resolves.toEqual({ name: 'first' });

    podMock.startErrors.push(new Error('startup failed 2'), new Error('startup failed 3'));
    const second = service.invoke({
      eventName: 'run',
      payload: { name: 'second' },
      returnStream: false
    });

    await expect(second).resolves.toEqual({ name: 'second' });
    expect(podMock.pods).toHaveLength(6);
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 0,
        idle: 0
      },
      totalRequests: 2,
      errorRate: 0
    });
  });

  it('updates live concurrency and adds pods when minPods increases', async () => {
    const service = createService(makeConfig({ minPods: 1, maxPods: 3 }));

    await service.initialize();
    await service.updateConfig({
      minPods: 3,
      maxPods: 3,
      maxConcurrentRequestsPerPod: 4
    });

    expect(podMock.pods).toHaveLength(3);
    expect(service.getMetrics()).toMatchObject({
      pods: {
        total: 3,
        idle: 3
      },
      minPods: 3,
      maxPods: 3
    });
    expect(podMock.pods.every((pod) => pod.isAvailable())).toBe(true);
  });

  it('rolls idle pods immediately and retires busy pods after release', async () => {
    const service = createService(makeConfig({ minPods: 1, maxPods: 2 }));
    const releaseBusy = createDeferred<string>();

    podMock.invokeHandlers.push(() => releaseBusy.promise);

    await service.initialize();
    const originalPod = podMock.pods[0];
    const busy = service.invoke({
      eventName: 'run',
      payload: { name: 'busy' },
      returnStream: false
    });
    await waitFor(() => expect(originalPod.activeRequests).toBe(1));

    await service.updateConfig({ podTimeout: 2000 });

    expect(podMock.pods).toHaveLength(2);
    expect(originalPod.killedWith).toBeUndefined();
    expect(service.getMetrics().pods.total).toBe(2);

    releaseBusy.resolve('busy-result');
    await expect(busy).resolves.toBe('busy-result');
    await waitFor(() => expect(originalPod.killedWith).toBe('SIGTERM'));
    expect(service.getMetrics().pods.total).toBe(1);
  });

  it('recycles a pod after it reaches maxRequestsPerPod', async () => {
    const service = createService(
      makeConfig({
        minPods: 0,
        maxPods: 1,
        maxRequestsPerPod: 1
      })
    );

    await service.initialize();
    await expect(
      service.invoke({
        eventName: 'run',
        payload: { value: 1 },
        returnStream: false
      })
    ).resolves.toEqual({ value: 1 });

    expect(service.getMetrics().pods.total).toBe(0);
    expect(podMock.pods[0].killedWith).toBe('SIGTERM');
  });
});
