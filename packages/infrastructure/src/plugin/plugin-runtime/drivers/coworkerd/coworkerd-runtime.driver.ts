import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { CoworkerdConfigSchema, type CoworkerdConfigType, CoworkerdPluginConfigSchema, type CoworkerdPluginConfigType } from '@domain/entities/plugin-coworkerd.entity';
import type { PluginInvokeEventNameType, PluginRuntimeInvokeOptions, PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { createError } from '@domain/value-objects/error.vo';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import { getRuntimeMetrics, type RuntimeMetricsRecorder } from '@infrastructure/metrics';

import type { PluginRuntimeConfigRepo } from '../../plugin-runtime-config.repo';

import { CircuitBreaker, type CircuitBreakerOptions, type CircuitBreakerState } from './circuit-breaker';
import { CoworkerdApiClient } from './coworkerd-api.client';
import { mapCoworkerdApiError, mapErrorToFailureKind } from './error-handler';
import { HealthChecker } from './health-checker';
import { CoworkerdIngressInvoker } from './ingress-invoker';

export type CoworkerdWorkerPackageOptions = {
  code: string;
  tenantId: string;
  workerId: string;
  versionId: string;
  compatibilityDate: string;
  activate: true;
};

export type CoworkerdWorkerPackageResult = {
  bundle: Buffer;
  contentHash: string;
};

export type CoworkerdRuntimeDeps = {
  config: CoworkerdConfigType;
  defaultPluginConfig: CoworkerdPluginConfigType;
  /** Persist infrastructure configuration only, in a dedicated coworkerd namespace. */
  configRepo: Pick<PluginRuntimeConfigRepo<CoworkerdPluginConfigType>, 'getPluginRuntimeConfig' | 'savePluginRuntimeConfig' | 'resetPluginRuntimeConfig'>;
  /** Read the persisted upload-time artifact; registration never compiles plugin code. */
  resolveWorkerCode: (id: PluginUniqueIdType) => Promise<Result<string>>;
  compatibilityDate: string;
  package: (options: CoworkerdWorkerPackageOptions) => Promise<CoworkerdWorkerPackageResult>;
  managementFetch?: typeof fetch;
  ingressFetch?: typeof fetch;
  propagationTimeoutMs?: number;
  propagationPollMs?: number;
  metricsRecorder?: RuntimeMetricsRecorder;
  circuitBreakerOptions?: CircuitBreakerOptions;
  healthCheckIntervalMs?: number;
};

type Deployment = {
  uniqueId: PluginUniqueIdType;
  tenantId: string;
  workerId: string;
  versionId: string;
  contentHash: string;
  limits: CoworkerdPluginConfigType['limits'];
};

export type CoworkerdRuntimeStatus = {
  registered: boolean;
  deployment?: Deployment;
  remote?: unknown;
  inFlight: number;
  circuitBreaker?: {
    state: CircuitBreakerState;
    failureCount: number;
    isAvailable: boolean;
  };
};

/** Independent remote driver; process shutdown never deletes shared deployments. */
export class CoworkerdPluginRuntimeDriver implements PluginRuntimeManagerPort<CoworkerdPluginConfigType, CoworkerdRuntimeStatus> {
  private readonly api: CoworkerdApiClient;
  private readonly ingress: CoworkerdIngressInvoker;
  private readonly config: CoworkerdConfigType;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly healthChecker: HealthChecker;
  private readonly metrics: RuntimeMetricsRecorder;
  private readonly deployments = new Map<string, Deployment>();
  private readonly registrations = new Map<string, Promise<Result>>();
  private readonly mutations = new Map<string, Promise<unknown>>();
  private readonly requests = new Map<AbortController, string>();
  private readonly shutdownSignal = new AbortController();
  private destroyed = false;

  constructor(private readonly deps: CoworkerdRuntimeDeps) {
    this.config = CoworkerdConfigSchema.parse(deps.config);
    CoworkerdPluginConfigSchema.parse(deps.defaultPluginConfig);
    if (!this.config.internalInvokeGatewayUrl) throw new Error('Coworkerd requires an internal invoke gateway URL');
    for (const value of [deps.propagationTimeoutMs ?? 15_000, deps.propagationPollMs ?? 250]) {
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid propagation timeout/poll interval');
    }
    this.api = new CoworkerdApiClient({ ...this.config, fetch: deps.managementFetch, signal: this.shutdownSignal.signal });
    this.ingress = new CoworkerdIngressInvoker({ ...this.config, fetch: deps.ingressFetch });
    this.circuitBreaker = new CircuitBreaker(deps.circuitBreakerOptions);
    this.healthChecker = new HealthChecker({
      api: this.api,
      circuitBreaker: this.circuitBreaker,
      probeIntervalMs: deps.healthCheckIntervalMs ?? (deps.managementFetch ? 0 : 30_000)
    });
    this.metrics = deps.metricsRecorder ?? getRuntimeMetrics();
    this.healthChecker.start();
  }

  private key(id: PluginUniqueIdType): string {
    return JSON.stringify([id.pluginId, id.version, id.etag]);
  }

  private physicalIdentity(id: PluginUniqueIdType, tenantId: string) {
    const digest = createHash('sha256').update(JSON.stringify([tenantId, this.key(id), this.deps.compatibilityDate, this.config.internalInvokeGatewayUrl])).digest('hex').slice(0, 48);
    return { workerId: `fg-${digest}`, versionId: `v-${digest}` };
  }

  private async locked<T>(pluginId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.mutations.get(pluginId) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(work);
    this.mutations.set(pluginId, next);
    try { return await next; } finally {
      if (this.mutations.get(pluginId) === next) this.mutations.delete(pluginId);
    }
  }

  async getConfig(pluginId: string): Promise<Result<CoworkerdPluginConfigType>> {
    try {
      const [config, error] = await this.deps.configRepo.getPluginRuntimeConfig(pluginId);
      if (error) return failureResult(error);
      return successResult(CoworkerdPluginConfigSchema.parse(config));
    } catch (error) { return this.failed(error); }
  }

  async updateConfig(pluginId: string, config: CoworkerdPluginConfigType): Promise<Result> {
    return this.locked(pluginId, async () => {
      if (this.destroyed) return this.closed();
      try {
        const parsed = CoworkerdPluginConfigSchema.parse(config);
        const [previous, error] = await this.getConfig(pluginId);
        if (error) return failureResult(error);
        // Tenant movement needs an explicit migration, not an implicit orphaned deployment.
        if (parsed.tenantId !== previous.tenantId) return this.failed(new Error('Tenant migration requires unregistering deployments and explicit migration'));
        return await this.deps.configRepo.savePluginRuntimeConfig(pluginId, parsed);
      } catch (error) { return this.failed(error); }
    });
  }

  async resetConfig(pluginId: string): Promise<Result> {
    return this.locked(pluginId, async () => {
      if (this.destroyed) return this.closed();
      const [previous, readError] = await this.getConfig(pluginId);
      if (readError) return failureResult(readError);
      if (this.deps.defaultPluginConfig.tenantId !== previous.tenantId) {
        return this.failed(new Error('Resetting to a different tenant requires unregistering deployments and explicit migration'));
      }
      const [, error] = await this.deps.configRepo.resetPluginRuntimeConfig(pluginId);
      if (error) return failureResult(error);
      return successResult({});
    });
  }

  register(uniqueId: PluginUniqueIdType): Promise<Result> {
    if (this.destroyed) return Promise.resolve(this.closed());
    const key = this.key(uniqueId);
    const pending = this.registrations.get(key);
    if (pending) return pending;
    const operation = this.locked(uniqueId.pluginId, () => this.deploy(uniqueId));
    this.registrations.set(key, operation);
    void operation.then(
      () => { this.registrations.delete(key); },
      () => { this.registrations.delete(key); }
    );
    return operation;
  }

  private async deploy(uniqueId: PluginUniqueIdType): Promise<Result> {
    if (this.destroyed) return this.closed();
    try {
      if (!uniqueId.pluginId || !uniqueId.version || !uniqueId.etag) throw new Error('Incomplete immutable plugin identity');
      const key = this.key(uniqueId);
      const [config, configError] = await this.getConfig(uniqueId.pluginId);
      if (configError) return failureResult(configError);
      const existing = this.deployments.get(key);
      if (existing && sameLimits(existing.limits, config.limits)) return successResult({});
      if (!existing) {
        const [code, entryError] = await this.deps.resolveWorkerCode(uniqueId);
        if (entryError) return failureResult(entryError);
        // A dedicated physical Worker per immutable installation prevents active-version aliasing.
        const { workerId, versionId } = this.physicalIdentity(uniqueId, config.tenantId);
        const bundle = await this.deps.package({
          code, tenantId: config.tenantId, workerId, versionId,
          compatibilityDate: this.deps.compatibilityDate,
          activate: true
        });
        if (this.destroyed) return this.closed();
        const [, tenantError] = await this.api.ensureTenant(config.tenantId);
        if (tenantError) {
          this.circuitBreaker.recordFailure(tenantError);
          return failureResult(mapCoworkerdApiError(tenantError));
        }
        const [, uploadError] = await this.api.uploadVersion({ tenantId: config.tenantId, workerId, versionId, bundle: bundle.bundle, activate: true });
        if (uploadError) {
          this.circuitBreaker.recordFailure(uploadError);
          return failureResult(mapCoworkerdApiError(uploadError));
        }
        this.circuitBreaker.recordSuccess();
        // upload?activate=true is atomic, trial-loads and installs the manifest route.
        // Repeating it with identical bytes is safe across host replicas.
        const [, limitsError] = await this.api.setWorkerLimits(config.tenantId, workerId, config.limits);
        if (limitsError) return failureResult(limitsError);
        const [, propagationError] = await this.waitForPropagation();
        if (propagationError) return failureResult(propagationError);
        if (this.destroyed) return this.closed();
        this.deployments.set(key, { uniqueId: { ...uniqueId }, tenantId: config.tenantId, workerId, versionId, contentHash: bundle.contentHash, limits: { ...config.limits } });
      } else {
        const [, limitsError] = await this.api.setWorkerLimits(existing.tenantId, existing.workerId, config.limits);
        if (limitsError) return failureResult(limitsError);
        const [, propagationError] = await this.waitForPropagation();
        if (propagationError) return failureResult(propagationError);
        existing.limits = { ...config.limits };
      }
      return successResult({});
    } catch (error) { return this.failed(error); }
  }

  /** Poll metadata only. Never execute a plugin as a readiness probe. */
  private async waitForPropagation(): Promise<Result> {
    const [initial, error] = await this.api.getStatus();
    if (error) return failureResult(error);
    const revision = initial.storage?.tenantsRevision;
    if (!revision || !/^\d+$/.test(revision)) return this.failed(new Error('Missing coworkerd desired-state revision'));
    const target = BigInt(revision);
    const deadline = Date.now() + (this.deps.propagationTimeoutMs ?? 15_000);
    let status = initial;
    while (true) {
      const serving = (status.nodes as Array<{ drain?: { draining?: boolean }; state?: string; storage?: { appliedTenantsRevision?: string }; reachable?: boolean }> | undefined)?.filter((node) => !node.drain?.draining && node.state !== 'draining') ?? [];
      if (serving.length > 0 && serving.every((node) => {
        const applied = node.storage?.appliedTenantsRevision;
        return node.reachable === true && applied && /^\d+$/.test(applied) && BigInt(applied) >= target;
      })) return successResult({});
      if (Date.now() >= deadline) return this.failed(new Error('Coworkerd routing propagation timed out; deployment may be active remotely'));
      await delay(Math.min(this.deps.propagationPollMs ?? 250, deadline - Date.now()), undefined, { signal: this.shutdownSignal.signal });
      const [next, nextError] = await this.api.getStatus();
      if (nextError) return failureResult(nextError);
      status = next;
    }
  }

  async unregister(uniqueId: PluginUniqueIdType): Promise<Result> {
    return this.locked(uniqueId.pluginId, async () => {
      if (this.destroyed) return this.closed();
      const key = this.key(uniqueId);
      const [config, configError] = await this.getConfig(uniqueId.pluginId);
      if (configError) return failureResult(configError);
      // Reconstruct the stable address after a host restart; no local cache is required to remove it.
      const deployment = this.deployments.get(key) ?? { tenantId: config.tenantId, ...this.physicalIdentity(uniqueId, config.tenantId) };
      if ([...this.requests.values()].includes(key)) return this.failed(new Error('Cannot unregister a deployment with active requests'));
      try {
        const [, error] = await this.api.deleteWorker(deployment.tenantId, deployment.workerId);
        if (error && !(error.code === 'NOT_FOUND' || (error.data as { status?: number })?.status === 404)) return failureResult(error);
        // Coworkerd Worker removal retains immutable versions. Delete this inactive version too so
        // repeated register/unregister cycles do not consume the tenant's versionsPerWorker quota.
        const [, versionError] = await this.api.deleteVersion(deployment.tenantId, deployment.workerId, deployment.versionId);
        if (versionError && !(versionError.code === 'NOT_FOUND' || (versionError.data as { status?: number })?.status === 404)) return failureResult(versionError);
        const [, propagationError] = await this.waitForPropagation();
        if (propagationError) return failureResult(propagationError);
        this.deployments.delete(key);
        return successResult({});
      } catch (error) { return this.failed(error); }
    });
  }

  async status(uniqueId: PluginUniqueIdType): Promise<Result<CoworkerdRuntimeStatus>> {
    const key = this.key(uniqueId);
    const cached = this.deployments.get(key);
    const [config, configError] = await this.getConfig(uniqueId.pluginId);
    if (configError) return failureResult(configError);
    const deployment = cached ?? { uniqueId: { ...uniqueId }, tenantId: config.tenantId, ...this.physicalIdentity(uniqueId, config.tenantId), contentHash: '', limits: config.limits };
    const [remote, error] = await this.api.getWorker(deployment.tenantId, deployment.workerId);
    if (error) {
      if (error.code === 'NOT_FOUND' || (error.data as { status?: number } | undefined)?.status === 404) {
        return successResult({ registered: false, inFlight: 0 });
      }
      return failureResult(error);
    }
    const registered = remote.workerId === `${deployment.tenantId}/${deployment.workerId}` && remote.activeVersion === deployment.versionId && remote.valid;
    return successResult({
      registered,
      deployment: structuredClone(deployment),
      remote,
      inFlight: [...this.requests.values()].filter((id) => id === key).length,
      circuitBreaker: {
        state: this.circuitBreaker.getState(),
        failureCount: this.circuitBreaker.getStats().consecutiveFailures,
        isAvailable: this.circuitBreaker.isAvailable()
      }
    });
  }

  globalStatus() { return this.healthChecker.checkHealth(); }

  async invoke<R = unknown, S extends boolean = boolean, E extends PluginInvokeEventNameType = PluginInvokeEventNameType, P = unknown>(arg: {
    uniqueId: PluginUniqueIdType; eventName: E; payload: P; returnStream: S; options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    if (this.destroyed) return this.closed();

    const metricAttributes = {
      pluginId: arg.uniqueId.pluginId,
      pluginVersion: arg.uniqueId.version,
      pluginEtag: arg.uniqueId.etag,
      runtimeMode: 'coworkerd' as const
    };
    this.metrics.recordInvocationStarted(metricAttributes);
    const startTime = Date.now();

    if (arg.eventName !== 'run') {
      this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: 'unknown' });
      return failureResult(createError(ErrorCode.pluginRuntimeEventNotSupported));
    }

    if (!this.circuitBreaker.isAvailable()) {
      this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: 'circuit_breaker_open' });
      return failureResult(createError(ErrorCode.pluginRuntimeClusterUnavailable, {
        message: 'Coworkerd cluster circuit breaker is open; failing fast without calling network',
        data: { circuitBreakerOpen: true }
      }));
    }

    try {
      const reverseContext = arg.options?.internalInvoke;
      if (!reverseContext || !arg.options?.invocationId || reverseContext.gatewayUrl.replace(/\/+$/, '') !== this.config.internalInvokeGatewayUrl!.replace(/\/+$/, '')) {
        throw new Error('Missing or mismatched reverse-invoke context');
      }
      const [, registrationError] = await this.register(arg.uniqueId);
      if (registrationError) {
        this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: mapErrorToFailureKind(registrationError) });
        return failureResult(registrationError);
      }
      if (this.destroyed) return this.closed();
      const prepared = await this.locked(arg.uniqueId.pluginId, async () => {
        if (this.destroyed) throw new Error('Coworkerd runtime is shutting down');
        const deployment = this.deployments.get(this.key(arg.uniqueId));
        if (!deployment) throw new Error('Deployment was unregistered before invocation');
        // Reserve the request under the same lock as unregister, before issuing any HTTP request.
        const token = reverseContext.issueToken(deployment.tenantId);
        if (!token) throw new Error('Reverse-invoke issuer returned an empty token');
        const cancellation = new AbortController();
        this.requests.set(cancellation, this.key(arg.uniqueId));
        return { deployment, token, cancellation };
      });
      // The callback and InvokePort remain on the host; only this scoped token crosses ingress.
      const { deployment, token, cancellation } = prepared;
      let streamTransferred = false;
      const finish = () => { this.requests.delete(cancellation); cancellation.abort(); };
      try {
        const result = await this.ingress.invoke<R, S>({
          tenantId: deployment.tenantId, workerId: deployment.workerId, pluginId: arg.uniqueId.pluginId,
          eventName: arg.eventName, payload: arg.payload, returnStream: arg.returnStream,
          invocationId: arg.options!.invocationId, invokeToken: token,
          timeoutMs: arg.options!.timeout, signal: cancellation.signal, onStreamComplete: finish
        });
        if (result[1]) {
          this.circuitBreaker.recordFailure(result[1]);
          this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: mapErrorToFailureKind(result[1]) });
          return result;
        }
        this.circuitBreaker.recordSuccess();
        if (arg.returnStream) {
          const stream = result[0] as StreamData<R>;
          stream.onEnd(() => {
            this.metrics.recordInvocationCompleted({ ...metricAttributes, durationMs: Date.now() - startTime });
            finish();
          }).onError((streamErr) => {
            this.circuitBreaker.recordFailure(streamErr);
            this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: mapErrorToFailureKind(streamErr) });
            finish();
          });
          stream.toReadable().once('close', finish);
          streamTransferred = true;
        } else {
          this.metrics.recordInvocationCompleted({ ...metricAttributes, durationMs: Date.now() - startTime });
        }
        return result;
      } finally {
        if (!streamTransferred) { this.requests.delete(cancellation); cancellation.abort(); }
      }
    } catch (error) {
      this.circuitBreaker.recordFailure(error);
      this.metrics.recordInvocationFailed({ ...metricAttributes, failureKind: mapErrorToFailureKind(error) });
      return this.failed(error);
    }
  }

  async shutdown(timeout = 30_000): Promise<Result> {
    if (!Number.isSafeInteger(timeout) || timeout < 0) return this.failed(new Error('Invalid shutdown timeout'));
    this.destroyed = true;
    this.healthChecker.stop();
    const deadline = Date.now() + timeout;
    while ((this.requests.size || this.registrations.size || this.mutations.size) && Date.now() < deadline) await delay(10);
    this.shutdownSignal.abort();
    for (const request of this.requests.keys()) request.abort();
    this.deployments.clear();
    return successResult({});
  }

  private closed() { return failureResult(createError(ErrorCode.pluginRuntimeManagerDestroyed)); }
  private failed(error: unknown) { return failureResult({ en: 'Coworkerd runtime operation failed', 'zh-CN': 'Coworkerd 运行时操作失败' }, error); }
}

function sameLimits(a: CoworkerdPluginConfigType['limits'], b: CoworkerdPluginConfigType['limits']): boolean {
  return a.cpuMs === b.cpuMs && a.memoryMiB === b.memoryMiB;
}
