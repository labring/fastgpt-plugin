import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import type { PluginType } from '@domain/entities/plugin.entity';
import { createError } from '@domain/value-objects/error.vo';
import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { failureResult, type ResultFailure, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import type { RuntimeMetricsRecorder } from '@infrastructure/metrics';
import { PluginRepo, type PluginRepoDeps } from '@infrastructure/plugin/plugin.repo';

import {
  classifyCoworkerdFallbackError,
  CoworkerdFallbackRuntimeDriver
} from './coworkerd-fallback-runtime.driver';
import { CoworkerdPluginRuntimeDriver } from './coworkerd-runtime.driver';
import { readWorkerArtifact } from './worker-artifact';

const pluginA = { pluginId: 'plugin-a', version: '1.0.0', etag: 'etag-a' };

function makeFailure(error: Error): ResultFailure {
  return failureResult(error)[1]!;
}

function createFixture() {
  const coworkerd = {
    register: vi.fn(async () => successResult({})),
    unregister: vi.fn(async () => successResult({})),
    getConfig: vi.fn(async () =>
      successResult({ tenantId: 'system', limits: { cpuMs: 200, memoryMiB: 128 } })
    ),
    updateConfig: vi.fn(async () => successResult({})),
    resetConfig: vi.fn(async () => successResult({})),
    status: vi.fn(async () => successResult({ registered: true, inFlight: 0 })),
    globalStatus: vi.fn(async () =>
      successResult({ healthy: true, reachableNodes: 2, totalNodes: 2 })
    ),
    shutdown: vi.fn(async () => successResult({})),
    invoke: vi.fn(async () => successResult({ source: 'coworkerd' }))
  };

  const localPool = {
    register: vi.fn(async () => successResult({})),
    unregister: vi.fn(async () => successResult({})),
    getConfig: vi.fn(async () => successResult({})),
    updateConfig: vi.fn(async () => successResult({})),
    resetConfig: vi.fn(async () => successResult({})),
    status: vi.fn(async () => successResult({ totalPods: 1, idlePods: 1 })),
    globalStatus: vi.fn(async () => successResult({ totalPods: 1, totalServices: 1 })),
    shutdown: vi.fn(async () => successResult({})),
    invoke: vi.fn(async () => successResult({ source: 'localPool' }))
  };

  const metricsRecorder: RuntimeMetricsRecorder = {
    recordInvocationStarted: vi.fn(),
    recordInvocationCompleted: vi.fn(),
    recordInvocationFailed: vi.fn(),
    recordPodCrash: vi.fn(),
    recordPodStartup: vi.fn(),
    recordFallback: vi.fn()
  };

  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  const driver = new CoworkerdFallbackRuntimeDriver({
    coworkerd: coworkerd as never,
    localPool: localPool as never,
    metricsRecorder,
    logger
  });

  const invokeArg = (returnStream = false) => ({
    uniqueId: pluginA,
    eventName: 'run' as const,
    payload: { input: { x: 1 } },
    returnStream
  });

  return { driver, coworkerd, localPool, metricsRecorder, logger, invokeArg };
}

describe('classifyCoworkerdFallbackError', () => {
  it('classifies static incompatibility errors as sticky fallback', () => {
    expect(
      classifyCoworkerdFallbackError(
        makeFailure(createError(ErrorCode.pluginRuntimeArtifactBuildFailed, { message: 'node:fs unsupported' }))
      )
    ).toEqual({ eligible: true, sticky: true, reason: 'artifact_build_failed' });

    expect(
      classifyCoworkerdFallbackError(
        makeFailure(createError(ErrorCode.pluginRuntimeTrialLoadFailed, { message: 'LOAD_FAILED' }))
      )
    ).toEqual({ eligible: true, sticky: true, reason: 'trial_load_failed' });

    // Wrapped inside a generic Coworkerd runtime operation failed error
    const wrapped = failureResult(
      { en: 'Coworkerd runtime operation failed', 'zh-CN': 'Coworkerd 运行时操作失败' },
      createError(ErrorCode.pluginRuntimeArtifactBuildFailed, { message: 'node:child_process' })
    )[1]!;
    expect(classifyCoworkerdFallbackError(wrapped)).toEqual({
      eligible: true,
      sticky: true,
      reason: 'artifact_build_failed'
    });
  });

  it('classifies circuit breaker open and cluster unavailability as transient fallback', () => {
    expect(
      classifyCoworkerdFallbackError(
        makeFailure(
          createError(ErrorCode.pluginRuntimeClusterUnavailable, {
            message: 'Coworkerd cluster circuit breaker is open',
            data: { circuitBreakerOpen: true }
          })
        )
      )
    ).toEqual({ eligible: true, sticky: false, reason: 'circuit_breaker_open' });

    expect(
      classifyCoworkerdFallbackError(
        makeFailure(
          createError(ErrorCode.pluginRuntimeClusterUnavailable, {
            message: 'Coworkerd cluster gateway error (502): Bad Gateway',
            data: { status: 502 }
          })
        )
      )
    ).toEqual({ eligible: true, sticky: false, reason: 'cluster_unavailable' });

    const propagationTimeout = failureResult(
      { en: 'Coworkerd runtime operation failed', 'zh-CN': 'Coworkerd 运行时操作失败' },
      new Error('Coworkerd routing propagation timed out; deployment may be active remotely')
    )[1]!;
    expect(classifyCoworkerdFallbackError(propagationTimeout)).toEqual({
      eligible: true,
      sticky: false,
      reason: 'cluster_unavailable'
    });
  });

  it('never falls back on quota limits (503/504), invoke timeouts, business errors, or unsupported events', () => {
    const nonFallbackErrors = [
      createError(ErrorCode.pluginInvokeCpuLimitExceeded, { data: { status: 503, code: 'CPU_LIMIT_EXCEEDED' } }),
      createError(ErrorCode.pluginInvokeMemoryLimitExceeded, { data: { status: 503, code: 'MEMORY_LIMIT_EXCEEDED' } }),
      createError(ErrorCode.pluginInvokeTimeout, { data: { status: 504 } }),
      createError(ErrorCode.pluginInvokeFailed, { data: { status: 500, code: 'EXECUTION_FAILED' } }),
      createError(ErrorCode.pluginRuntimeEventNotSupported, { data: { status: 405 } }),
      createError(ErrorCode.pluginRuntimeManagerDestroyed),
      createError(ErrorCode.pluginRuntimePluginNotFound, { data: { status: 404 } })
    ];

    for (const err of nonFallbackErrors) {
      expect(classifyCoworkerdFallbackError(makeFailure(err))).toEqual({ eligible: false });
    }
  });
});

describe('CoworkerdFallbackRuntimeDriver', () => {
  it('routes normal compatible plugins strictly to Coworkerd without touching localPool', async () => {
    const f = createFixture();
    expect((await f.driver.register(pluginA))[1]).toBeNull();
    const [res, err] = await f.driver.invoke(f.invokeArg());
    expect(err).toBeNull();
    expect(res).toEqual({ source: 'coworkerd' });
    expect(f.localPool.register).not.toHaveBeenCalled();
    expect(f.localPool.invoke).not.toHaveBeenCalled();
    expect(f.metricsRecorder.recordFallback).not.toHaveBeenCalled();
  });

  it('sticks statically incompatible plugins to localPool on register and skips Coworkerd on subsequent invokes', async () => {
    const f = createFixture();
    f.coworkerd.register.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeArtifactBuildFailed, { message: 'node:fs unsupported' })) as never
    );

    const [, regErr] = await f.driver.register(pluginA);
    expect(regErr).toBeNull();
    expect(f.localPool.register).toHaveBeenCalledTimes(1);
    expect(f.logger.warn).toHaveBeenCalledTimes(1);
    expect(f.metricsRecorder.recordFallback).toHaveBeenCalledWith({
      pluginId: pluginA.pluginId,
      pluginVersion: pluginA.version,
      pluginEtag: pluginA.etag,
      runtimeMode: 'coworkerd',
      targetRuntimeMode: 'localPool',
      reason: 'artifact_build_failed',
      phase: 'register',
      sticky: true
    });

    // Subsequent invocations go straight to localPool without calling Coworkerd again
    const [res1, err1] = await f.driver.invoke(f.invokeArg());
    const [res2, err2] = await f.driver.invoke(f.invokeArg());
    expect(err1).toBeNull();
    expect(err2).toBeNull();
    expect(res1).toEqual({ source: 'localPool' });
    expect(res2).toEqual({ source: 'localPool' });
    expect(f.coworkerd.invoke).not.toHaveBeenCalled();
    expect(f.localPool.register).toHaveBeenCalledTimes(1);
    expect(f.logger.warn).toHaveBeenCalledTimes(1);
    expect(f.logger.debug).toHaveBeenCalled();
  });

  it('sticks plugins that fail 422 Trial Load during invoke and lazily registers them on localPool', async () => {
    const f = createFixture();
    f.coworkerd.invoke.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeTrialLoadFailed, { message: 'LOAD_FAILED' })) as never
    );

    const [res1, err1] = await f.driver.invoke(f.invokeArg());
    expect(err1).toBeNull();
    expect(res1).toEqual({ source: 'localPool' });
    expect(f.localPool.register).toHaveBeenCalledTimes(1);
    expect(f.metricsRecorder.recordFallback).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'trial_load_failed', phase: 'invoke', sticky: true })
    );

    // Next invoke uses cached sticky fallback without hitting Coworkerd
    await f.driver.invoke(f.invokeArg());
    expect(f.coworkerd.invoke).toHaveBeenCalledTimes(1);
    expect(f.localPool.invoke).toHaveBeenCalledTimes(2);
  });

  it('falls back transiently when Coworkerd cluster is unavailable or circuit-broken and automatically recovers', async () => {
    const f = createFixture();
    f.coworkerd.register.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable, { message: 'ECONNREFUSED' })) as never
    );

    // Register falls back transiently to localPool
    expect((await f.driver.register(pluginA))[1]).toBeNull();
    expect(f.localPool.register).toHaveBeenCalledTimes(1);

    // First invoke hits open circuit breaker -> transient fallback to localPool
    f.coworkerd.invoke.mockResolvedValueOnce(
      failureResult(
        createError(ErrorCode.pluginRuntimeClusterUnavailable, {
          message: 'Coworkerd cluster circuit breaker is open',
          data: { circuitBreakerOpen: true }
        })
      ) as never
    );
    const [res1, err1] = await f.driver.invoke(f.invokeArg());
    expect(err1).toBeNull();
    expect(res1).toEqual({ source: 'localPool' });
    expect(f.metricsRecorder.recordFallback).toHaveBeenLastCalledWith(
      expect.objectContaining({ reason: 'circuit_breaker_open', phase: 'invoke', sticky: false })
    );

    // Cluster recovers -> next invoke automatically goes back to Coworkerd
    const [res2, err2] = await f.driver.invoke(f.invokeArg());
    expect(err2).toBeNull();
    expect(res2).toEqual({ source: 'coworkerd' });
    expect(f.coworkerd.invoke).toHaveBeenCalledTimes(2);
  });

  it('never falls back on CPU limit, memory limit, timeout, or plugin business errors', async () => {
    const f = createFixture();
    const errors = [
      createError(ErrorCode.pluginInvokeCpuLimitExceeded, { data: { status: 503 } }),
      createError(ErrorCode.pluginInvokeMemoryLimitExceeded, { data: { status: 503 } }),
      createError(ErrorCode.pluginInvokeTimeout, { data: { status: 504 } }),
      createError(ErrorCode.pluginInvokeFailed, { data: { status: 500 } })
    ];

    for (const error of errors) {
      f.coworkerd.invoke.mockResolvedValueOnce(failureResult(error) as never);
      const [, err] = await f.driver.invoke(f.invokeArg());
      expect(err?.code).toBe(error.code);
    }

    expect(f.localPool.register).not.toHaveBeenCalled();
    expect(f.localPool.invoke).not.toHaveBeenCalled();
    expect(f.metricsRecorder.recordFallback).not.toHaveBeenCalled();
  });

  it('falls back on pre-stream failures but never retries mid-stream errors', async () => {
    const f = createFixture();

    // Pre-stream failure -> falls back to localPool stream
    const fallbackStream = StreamData.create<{ ok: boolean }>((s) => {
      s.write({ ok: true });
      s.close();
    });
    f.coworkerd.invoke.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable, { message: '502 Bad Gateway' })) as never
    );
    f.localPool.invoke.mockResolvedValueOnce(successResult(fallbackStream) as never);

    const [stream1, err1] = await f.driver.invoke(f.invokeArg(true));
    expect(err1).toBeNull();
    expect(stream1).toBe(fallbackStream);
    expect(f.localPool.invoke).toHaveBeenCalledTimes(1);

    // Mid-stream failure after Coworkerd returned StreamData -> NOT retried on localPool
    const failingCoworkerdStream = StreamData.create<{ ok: boolean }>();
    f.coworkerd.invoke.mockResolvedValueOnce(successResult(failingCoworkerdStream) as never);

    const [stream2, err2] = await f.driver.invoke(f.invokeArg(true));
    expect(err2).toBeNull();
    expect(stream2).toBe(failingCoworkerdStream);

    const streamError = new Promise<Error>((resolve) => {
      failingCoworkerdStream.onError((err) => resolve(err));
    });
    failingCoworkerdStream.fail(new Error('mid-stream disconnect'));
    expect((await streamError).message).toBe('mid-stream disconnect');
    expect(f.localPool.invoke).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent lazy localPool registrations and treats already-registered as success', async () => {
    const f = createFixture();
    f.coworkerd.invoke.mockResolvedValue(
      failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable, { message: 'offline' })) as never
    );

    let resolveRegister!: () => void;
    f.localPool.register.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRegister = () => resolve(successResult({}));
        })
    );

    const p1 = f.driver.invoke(f.invokeArg());
    const p2 = f.driver.invoke(f.invokeArg());
    const p3 = f.driver.invoke(f.invokeArg());

    // Wait a tick for all three calls to enter ensureLocalPoolRegistered
    await new Promise((r) => setTimeout(r, 10));
    expect(f.localPool.register).toHaveBeenCalledTimes(1);

    resolveRegister();
    const results = await Promise.all([p1, p2, p3]);
    expect(results.every(([, err]) => err === null)).toBe(true);
    expect(f.localPool.invoke).toHaveBeenCalledTimes(3);

    // Already-registered error on a fresh driver is treated as idempotent success
    const f2 = createFixture();
    f2.coworkerd.invoke.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeArtifactBuildFailed)) as never
    );
    f2.localPool.register.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeAlreadyRegistered)) as never
    );
    const [res, err] = await f2.driver.invoke(f2.invokeArg());
    expect(err).toBeNull();
    expect(res).toEqual({ source: 'localPool' });
  });

  it('clears sticky state on unregister and ignores not-found from whichever side never hosted the plugin', async () => {
    const f = createFixture();
    f.coworkerd.register.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeArtifactBuildFailed)) as never
    );
    await f.driver.register(pluginA);

    // Coworkerd is unreachable during unregister of a sticky-only plugin -> localPool still cleans up cleanly
    f.coworkerd.unregister.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable)) as never
    );
    expect((await f.driver.unregister(pluginA))[1]).toBeNull();
    expect(f.localPool.unregister).toHaveBeenCalledWith(pluginA, undefined);

    // Sticky state was cleared so next register retries Coworkerd
    expect((await f.driver.register(pluginA))[1]).toBeNull();
    expect(f.coworkerd.register).toHaveBeenCalledTimes(2);

    // Unregistering a Coworkerd-only plugin ignores localPool plugin-not-found
    f.localPool.unregister.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimePluginNotFound)) as never
    );
    expect((await f.driver.unregister(pluginA))[1]).toBeNull();
  });

  it('exposes additive fallback observability in status() and globalStatus() and shuts down both runtimes', async () => {
    const f = createFixture();
    f.coworkerd.register.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeArtifactBuildFailed, { message: 'node:fs' })) as never
    );
    await f.driver.register(pluginA);

    const [pluginStatus, statusErr] = await f.driver.status(pluginA);
    expect(statusErr).toBeNull();
    expect(pluginStatus).toMatchObject({
      activeRuntime: 'localPool',
      fallback: {
        enabled: true,
        sticky: true,
        reason: 'artifact_build_failed',
        localPoolRegistered: true,
        localPool: { totalPods: 1, idlePods: 1 }
      }
    });

    const [globalStatus, globalErr] = await f.driver.globalStatus();
    expect(globalErr).toBeNull();
    expect(globalStatus).toMatchObject({
      healthy: true,
      reachableNodes: 2,
      totalNodes: 2,
      fallback: {
        enabled: true,
        stickyPluginCount: 1,
        transientFallbackCount: 0,
        localPool: { totalPods: 1, totalServices: 1 }
      }
    });

    // Even when Coworkerd health check fails, globalStatus reports degraded status with fallback info
    f.coworkerd.globalStatus.mockResolvedValueOnce(
      failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable, { message: 'cluster down' })) as never
    );
    const [degradedGlobal, degradedErr] = await f.driver.globalStatus();
    expect(degradedErr).toBeNull();
    expect(degradedGlobal).toMatchObject({
      healthy: false,
      coworkerdError: 'cluster down',
      fallback: { enabled: true, stickyPluginCount: 1 }
    });

    expect((await f.driver.shutdown(5000))[1]).toBeNull();
    expect(f.coworkerd.shutdown).toHaveBeenCalledWith(5000);
    expect(f.localPool.shutdown).toHaveBeenCalledWith(5000);
  });

  it('hands off upload fallback (no worker artifact) to first invoke and server-restart re-registration via real PluginRepo and CoworkerdPluginRuntimeDriver', async () => {
    const gatewayUrl = 'https://gateway.invalid/internal/plugin-invoke/v1';
    const plugin: PluginType = {
      ...pluginA,
      type: 'tool',
      name: { en: 'Legacy Node Tool', 'zh-CN': 'Legacy Node Tool' },
      description: { en: 'Uses node:fs', 'zh-CN': 'Uses node:fs' },
      icon: 'https://example.com/logo.svg',
      toolDescription: 'Legacy Node Tool'
    };
    const indexBytes = Buffer.from('import fs from "node:fs"; export default {};');
    const indexFile = new FileObject({
      metaData: {
        fileKey: 'index',
        fileName: 'index.js',
        contentType: 'application/javascript',
        etag: 'etag-file',
        size: indexBytes.length,
        createTime: new Date()
      },
      getReadStream: async () => successResult(Readable.from([indexBytes])),
      getBuffer: async () => successResult(indexBytes)
    });

    const objects = new Map<string, Buffer>();
    const record = { ...plugin, data: {}, status: 'disabled', _id: 'plugin-record' };
    const installation = {
      findOne: vi.fn(() => ({ lean: async () => null })),
      updateOne: vi.fn(async () => ({})),
      find: vi.fn(() => ({ lean: async () => [] })),
      deleteMany: vi.fn(async () => ({}))
    };
    const model = {
      findOneAndUpdate: vi.fn(() => ({ lean: async () => record })),
      updateOne: vi.fn(async () => ({})),
      findOne: vi.fn(() => ({ lean: async () => null })),
      create: vi.fn(async () => ({ toObject: () => record })),
      find: vi.fn(() => ({ lean: async () => [record] })),
      deleteMany: vi.fn(async () => ({}))
    };
    const storage = {
      save: vi.fn(async (input: { fileKey: string; file: Buffer | Readable }) => {
        objects.set(input.fileKey, Buffer.isBuffer(input.file) ? input.file : indexBytes);
        return successResult(indexFile);
      }),
      exists: vi.fn(async (key: string) => successResult(objects.has(key))),
      getBuffer: vi.fn(async (key: string) => successResult(objects.get(key)!)),
      deletePath: vi.fn(async () => successResult(true)),
      getFileObject: vi.fn(async (key: string) =>
        objects.has(key)
          ? successResult(
              new FileObject({
                metaData: indexFile.metaData,
                getBuffer: async () => successResult(objects.get(key)!),
                getReadStream: async () => successResult(Readable.from([objects.get(key)!]))
              })
            )
          : failureResult({ en: 'file not found', 'zh-CN': '文件未找到' })
      )
    };
    const artifactBuilder = {
      build: vi.fn(async () =>
        failureResult(
          createError(ErrorCode.pluginRuntimeArtifactBuildFailed, {
            message: 'Worker build failed: node:fs',
            reason: { en: 'Worker build failed: node:fs', 'zh-CN': 'Worker 构建失败：node:fs' }
          })
        )
      )
    };

    Reflect.set(PluginRepo, '_instance', undefined);
    const repo = PluginRepo.getInstance({
      artifactBuilder,
      allowArtifactBuildFallback: true,
      mongoClient: {
        getModel: (name: string) =>
          name === 'plugin'
            ? model
            : name === 'pluginInstallation'
              ? installation
              : { deleteMany: vi.fn() }
      },
      privateRemoteFileStorageRepo: storage,
      publicRemoteFileStorageRepo: { ...storage, save: vi.fn(async () => successResult(indexFile)) },
      localFileStorageRepo: { deletePath: vi.fn(async () => successResult(true)) }
    } as unknown as PluginRepoDeps);

    // 1. Upload preserves raw index.js without writing worker/artifact.json and returns runtimeRegistrationRequired: false
    const [createRes, createErr] = await repo.createPlugin({
      plugin,
      files: { index: indexFile, manifest: indexFile },
      pending: true,
      source: 'system'
    });
    expect(createErr).toBeNull();
    expect(createRes).toEqual({ runtimeRegistrationRequired: false });
    expect(objects.has(`${pluginA.pluginId}/${pluginA.version}/${pluginA.etag}/index.js`)).toBe(true);
    expect(
      objects.has(`${pluginA.pluginId}/${pluginA.version}/${pluginA.etag}/worker/artifact.json`)
    ).toBe(false);

    const makeDrivers = () => {
      const managementFetch = vi.fn<typeof fetch>();
      const config = { tenantId: 'system', limits: { cpuMs: 200, memoryMiB: 128 } };
      const coworkerd = new CoworkerdPluginRuntimeDriver({
        config: {
          apiServerUrl: 'https://control.invalid',
          ingressUrl: 'https://ingress.invalid',
          managementToken: 'test',
          defaultLimits: config.limits,
          internalInvokeGatewayUrl: gatewayUrl,
          requestTimeoutMs: 1000
        },
        defaultPluginConfig: config,
        configRepo: {
          getPluginRuntimeConfig: async () => successResult(config),
          savePluginRuntimeConfig: async () => successResult({}),
          resetPluginRuntimeConfig: async () => successResult(config)
        },
        compatibilityDate: '2026-01-01',
        resolveWorkerCode: async (uniqueId) => {
          const [bytes, error] = await repo.getWorkerArtifact(uniqueId);
          if (error) return failureResult(error);
          return successResult(readWorkerArtifact(bytes, gatewayUrl).code);
        },
        package: vi.fn() as never,
        managementFetch,
        ingressFetch: vi.fn() as never
      });

      const localPool = {
        register: vi.fn(async () => successResult({})),
        unregister: vi.fn(async () => successResult({})),
        getConfig: vi.fn(async () => successResult({})),
        updateConfig: vi.fn(async () => successResult({})),
        resetConfig: vi.fn(async () => successResult({})),
        status: vi.fn(async () => successResult({ totalPods: 1, idlePods: 1 })),
        globalStatus: vi.fn(async () => successResult({ totalPods: 1, totalServices: 1 })),
        shutdown: vi.fn(async () => successResult({})),
        invoke: vi.fn(async () => successResult({ source: 'localPool' }))
      };

      const driver = new CoworkerdFallbackRuntimeDriver({
        coworkerd,
        localPool: localPool as never,
        logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
      });

      return { driver, coworkerd, localPool, managementFetch };
    };

    const invokeArg = {
      uniqueId: pluginA,
      eventName: 'run' as const,
      payload: { input: {} },
      returnStream: false as const,
      options: {
        invocationId: 'inv-handoff-1',
        internalInvoke: { gatewayUrl, issueToken: () => 'scoped-token' }
      }
    };

    // 2. First invoke without prior register(): JIT build fails with pluginRuntimeArtifactBuildFailed -> sticky fallback to localPool
    artifactBuilder.build.mockClear();
    const boot1 = makeDrivers();
    const [res1, err1] = await boot1.driver.invoke(invokeArg);
    expect(err1).toBeNull();
    expect(res1).toEqual({ source: 'localPool' });
    expect(artifactBuilder.build).toHaveBeenCalledTimes(1);
    expect(boot1.managementFetch).not.toHaveBeenCalled();
    expect(boot1.localPool.register).toHaveBeenCalledTimes(1);
    expect(boot1.localPool.invoke).toHaveBeenCalledTimes(1);

    // Subsequent invoke hits sticky cache directly without re-running JIT build
    const [res2, err2] = await boot1.driver.invoke(invokeArg);
    expect(err2).toBeNull();
    expect(res2).toEqual({ source: 'localPool' });
    expect(artifactBuilder.build).toHaveBeenCalledTimes(1);
    expect(boot1.localPool.invoke).toHaveBeenCalledTimes(2);
    await boot1.driver.shutdown(0);

    // 3. Simulated server restart (fresh drivers, same repo storage): init register() sticks to localPool
    artifactBuilder.build.mockClear();
    const boot2 = makeDrivers();
    const [, regErr] = await boot2.driver.register(pluginA);
    expect(regErr).toBeNull();
    expect(artifactBuilder.build).toHaveBeenCalledTimes(1);
    expect(boot2.managementFetch).not.toHaveBeenCalled();
    expect(boot2.localPool.register).toHaveBeenCalledTimes(1);

    const [res3, err3] = await boot2.driver.invoke(invokeArg);
    expect(err3).toBeNull();
    expect(res3).toEqual({ source: 'localPool' });
    expect(artifactBuilder.build).toHaveBeenCalledTimes(1);
    expect(boot2.localPool.invoke).toHaveBeenCalledTimes(1);
    await boot2.driver.shutdown(0);
  });
});
