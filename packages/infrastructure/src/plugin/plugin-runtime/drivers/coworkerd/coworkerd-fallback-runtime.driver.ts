import type { CoworkerdPluginConfigType } from '@domain/entities/plugin-coworkerd.entity';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import { RegisteredError } from '@domain/value-objects/error.vo';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import {
  failureResult,
  type Result,
  type ResultFailure,
  successResult
} from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import { getLogger, type Logger, mod } from '@infrastructure/logger';
import {
  getRuntimeMetrics,
  type RuntimeFallbackReason,
  type RuntimeMetricsRecorder
} from '@infrastructure/metrics';

import type {
  GlobalMetrics,
  LocalPoolPluginConfigType,
  ServiceMetrics
} from '../local-pool/types';

import type { CoworkerdRuntimeStatus } from './coworkerd-runtime.driver';
import { isClusterTransportFailure } from './error-handler';
import type { HealthCheckResult } from './health-checker';

export type StaticFallbackReason = Extract<
  RuntimeFallbackReason,
  'artifact_build_failed' | 'trial_load_failed'
>;
export type TransientFallbackReason = Extract<
  RuntimeFallbackReason,
  'circuit_breaker_open' | 'cluster_unavailable'
>;

export type FallbackDecision =
  | { eligible: false }
  | { eligible: true; sticky: true; reason: StaticFallbackReason }
  | { eligible: true; sticky: false; reason: TransientFallbackReason };

export type StickyFallbackRecord = {
  uniqueId: PluginUniqueIdType;
  reason: StaticFallbackReason;
  message: string;
  since: string;
  code?: string;
};

export type TransientFallbackRecord = {
  uniqueId: PluginUniqueIdType;
  reason: TransientFallbackReason;
  message: string;
  at: string;
  code?: string;
};

export type CoworkerdFallbackRuntimeStatus = CoworkerdRuntimeStatus & {
  activeRuntime: 'coworkerd' | 'localPool';
  fallback: {
    enabled: true;
    sticky: boolean;
    reason?: StaticFallbackReason;
    since?: string;
    message?: string;
    localPoolRegistered: boolean;
    localPool?: ServiceMetrics;
    coworkerdError?: string;
  };
};

export type CoworkerdFallbackGlobalStatus = HealthCheckResult & {
  coworkerdError?: string;
  fallback: {
    enabled: true;
    stickyPluginCount: number;
    stickyPlugins: Array<{
      pluginId: string;
      version: string;
      etag: string;
      reason: StaticFallbackReason;
      since: string;
    }>;
    transientFallbackCount: number;
    lastTransientFallback?: TransientFallbackRecord;
    localPool?: GlobalMetrics;
  };
};

export type CoworkerdFallbackRuntimeDeps = {
  coworkerd: PluginRuntimeManagerPort<CoworkerdPluginConfigType, CoworkerdRuntimeStatus>;
  localPool: PluginRuntimeManagerPort<LocalPoolPluginConfigType, ServiceMetrics>;
  metricsRecorder?: RuntimeMetricsRecorder;
  logger?: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;
};

const NON_FALLBACK_ERROR_CODES = new Set<string>([
  ErrorCode.pluginInvokeCpuLimitExceeded,
  ErrorCode.pluginInvokeMemoryLimitExceeded,
  ErrorCode.pluginInvokeTimeout,
  ErrorCode.pluginInvokeFailed,
  ErrorCode.pluginRuntimeEventNotSupported,
  ErrorCode.pluginRuntimeManagerDestroyed,
  ErrorCode.pluginRuntimePluginNotFound,
  ErrorCode.pluginRuntimeConfigLoadFailed,
  ErrorCode.pluginRuntimeConfigUpdateFailed,
  ErrorCode.pluginRuntimeConfigResetFailed,
  ErrorCode.pluginRuntimeConfigInvalid
]);

/**
 * Classifies whether a Coworkerd register/invoke failure is eligible for fallback to localPool.
 *
 * Explicit ErrorCodes are evaluated first so HTTP 503/504 quota/timeout errors (CPU limit,
 * memory limit, invocation timeout) and plugin business exceptions NEVER trigger fallback.
 */
export function classifyCoworkerdFallbackError(failure: ResultFailure): FallbackDecision {
  const candidates = collectErrorCandidates(failure);

  // 1. Check explicit ErrorCodes first across the failure and its cause chain.
  for (const candidate of candidates) {
    if (candidate.code && NON_FALLBACK_ERROR_CODES.has(candidate.code)) {
      return { eligible: false };
    }
  }

  for (const candidate of candidates) {
    if (candidate.code === ErrorCode.pluginRuntimeArtifactBuildFailed) {
      return { eligible: true, sticky: true, reason: 'artifact_build_failed' };
    }
    if (candidate.code === ErrorCode.pluginRuntimeTrialLoadFailed) {
      return { eligible: true, sticky: true, reason: 'trial_load_failed' };
    }
    if (candidate.code === ErrorCode.pluginRuntimeClusterUnavailable) {
      return {
        eligible: true,
        sticky: false,
        reason: isCircuitBreakerOpenCandidate(candidate)
          ? 'circuit_breaker_open'
          : 'cluster_unavailable'
      };
    }
  }

  // 2. Fallback checks for unmapped Coworkerd API/control-plane errors (e.g., setWorkerLimits,
  //    waitForPropagation, or raw HTTP/network errors).
  for (const candidate of candidates) {
    const normalizedCode = candidate.code?.toUpperCase() ?? '';
    if (normalizedCode === 'LOAD_FAILED' || candidate.status === 422) {
      return { eligible: true, sticky: true, reason: 'trial_load_failed' };
    }
  }

  for (const candidate of candidates) {
    if (isClusterTransportFailure(candidate.raw, candidate.status)) {
      return { eligible: true, sticky: false, reason: 'cluster_unavailable' };
    }
    if (
      candidate.message &&
      candidate.message.toLowerCase().includes('coworkerd routing propagation timed out')
    ) {
      return { eligible: true, sticky: false, reason: 'cluster_unavailable' };
    }
  }

  return { eligible: false };
}

/**
 * Wraps Coworkerd (primary) and LocalPool (fallback) behind PluginRuntimeManagerPort.
 *
 * - Static incompatibility (artifact build failure or 422 trial load failure) is remembered
 *   in-memory per immutable plugin identity (pluginId@version@etag) so subsequent invocations
 *   go directly to localPool without repeated build/deploy failures.
 * - Transient cluster unavailability (circuit breaker open, network/gateway 502/503/504)
 *   falls back per-call without poisoning sticky state, allowing automatic recovery once
 *   Coworkerd becomes healthy again.
 * - Quota errors (CPU/memory), timeouts, plugin business errors, and mid-stream failures
 *   are never retried on localPool.
 */
export class CoworkerdFallbackRuntimeDriver
  implements PluginRuntimeManagerPort<CoworkerdPluginConfigType, CoworkerdFallbackRuntimeStatus>
{
  private readonly coworkerd: CoworkerdFallbackRuntimeDeps['coworkerd'];
  private readonly localPool: CoworkerdFallbackRuntimeDeps['localPool'];
  private readonly metrics: RuntimeMetricsRecorder;
  private readonly logger: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;

  private readonly stickyFallbacks = new Map<string, StickyFallbackRecord>();
  private readonly localPoolRegistrations = new Map<string, Promise<Result>>();
  private readonly localPoolRegisteredKeys = new Set<string>();
  private transientFallbackCount = 0;
  private lastTransientFallback?: TransientFallbackRecord;

  constructor(deps: CoworkerdFallbackRuntimeDeps) {
    this.coworkerd = deps.coworkerd;
    this.localPool = deps.localPool;
    this.metrics = deps.metricsRecorder ?? getRuntimeMetrics();
    this.logger = deps.logger ?? getLogger(mod.plugin);
  }

  private key(uniqueId: PluginUniqueIdType): string {
    return `${uniqueId.pluginId}@${uniqueId.version}@${uniqueId.etag}`;
  }

  async register(uniqueId: PluginUniqueIdType, options?: unknown): Promise<Result> {
    const key = this.key(uniqueId);
    const sticky = this.stickyFallbacks.get(key);
    if (sticky) {
      this.logger.debug('Registering plugin directly on localPool via cached sticky fallback', {
        pluginId: uniqueId.pluginId,
        version: uniqueId.version,
        etag: uniqueId.etag,
        reason: sticky.reason
      });
      return this.ensureLocalPoolRegistered(uniqueId, options);
    }

    const [res, err] = await this.coworkerd.register(uniqueId, options as never);
    if (!err) {
      return successResult(res);
    }

    const decision = classifyCoworkerdFallbackError(err);
    if (!decision.eligible) {
      return failureResult(err);
    }

    this.recordFallbackEvent(uniqueId, decision, 'register', err);
    return this.ensureLocalPoolRegistered(uniqueId, options);
  }

  async unregister(
    uniqueId: PluginUniqueIdType,
    options?: { replacementUniqueId?: PluginUniqueIdType }
  ): Promise<Result> {
    const key = this.key(uniqueId);
    const wasSticky = this.stickyFallbacks.has(key);
    this.stickyFallbacks.delete(key);
    this.localPoolRegisteredKeys.delete(key);

    const [[, coworkerdErr], [, localPoolErr]] = await Promise.all([
      this.coworkerd.unregister(uniqueId, options),
      this.localPool.unregister(uniqueId, options)
    ]);

    const realLocalPoolErr =
      localPoolErr && !isNotFoundFailure(localPoolErr) ? localPoolErr : undefined;
    if (realLocalPoolErr) {
      return failureResult(realLocalPoolErr);
    }

    if (coworkerdErr && !isNotFoundFailure(coworkerdErr)) {
      if (wasSticky) {
        const decision = classifyCoworkerdFallbackError(coworkerdErr);
        if (decision.eligible) {
          this.logger.debug(
            'Ignoring Coworkerd unregister error for plugin previously hosted only on localPool',
            {
              pluginId: uniqueId.pluginId,
              version: uniqueId.version,
              etag: uniqueId.etag,
              reason: decision.reason
            }
          );
          return successResult({});
        }
      }
      return failureResult(coworkerdErr);
    }

    return successResult({});
  }

  getConfig(pluginId: string): Promise<Result<CoworkerdPluginConfigType>> {
    return this.coworkerd.getConfig(pluginId);
  }

  updateConfig(pluginId: string, config: CoworkerdPluginConfigType): Promise<Result> {
    return this.coworkerd.updateConfig(pluginId, config);
  }

  resetConfig(pluginId: string): Promise<Result> {
    return this.coworkerd.resetConfig(pluginId);
  }

  async status(uniqueId: PluginUniqueIdType): Promise<Result<CoworkerdFallbackRuntimeStatus>> {
    const key = this.key(uniqueId);
    const sticky = this.stickyFallbacks.get(key);
    const localPoolRegistered = this.localPoolRegisteredKeys.has(key);

    const [coworkerdStatus, coworkerdErr] = await this.coworkerd.status(uniqueId);
    const localPoolStatus =
      sticky || localPoolRegistered ? await this.safeLocalPoolStatus(uniqueId) : undefined;

    if (coworkerdErr) {
      if (!sticky && !localPoolStatus) {
        return failureResult(coworkerdErr);
      }
      return successResult({
        registered: Boolean(localPoolStatus),
        inFlight: 0,
        activeRuntime: 'localPool',
        fallback: {
          enabled: true,
          sticky: Boolean(sticky),
          ...(sticky
            ? { reason: sticky.reason, since: sticky.since, message: sticky.message }
            : {}),
          localPoolRegistered,
          ...(localPoolStatus ? { localPool: localPoolStatus } : {}),
          coworkerdError: getFailureSummary(coworkerdErr)
        }
      });
    }

    return successResult({
      ...coworkerdStatus,
      activeRuntime: sticky ? 'localPool' : 'coworkerd',
      fallback: {
        enabled: true,
        sticky: Boolean(sticky),
        ...(sticky ? { reason: sticky.reason, since: sticky.since, message: sticky.message } : {}),
        localPoolRegistered,
        ...(localPoolStatus ? { localPool: localPoolStatus } : {})
      }
    });
  }

  async globalStatus(): Promise<Result<CoworkerdFallbackGlobalStatus>> {
    const [[coworkerdGlobal, coworkerdErr], [localPoolGlobal]] = await Promise.all([
      this.coworkerd.globalStatus() as Promise<Result<HealthCheckResult>>,
      this.localPool.globalStatus() as Promise<Result<GlobalMetrics>>
    ]);

    const fallback: CoworkerdFallbackGlobalStatus['fallback'] = {
      enabled: true,
      stickyPluginCount: this.stickyFallbacks.size,
      stickyPlugins: [...this.stickyFallbacks.values()].map((entry) => ({
        pluginId: entry.uniqueId.pluginId,
        version: entry.uniqueId.version,
        etag: entry.uniqueId.etag,
        reason: entry.reason,
        since: entry.since
      })),
      transientFallbackCount: this.transientFallbackCount,
      ...(this.lastTransientFallback ? { lastTransientFallback: this.lastTransientFallback } : {}),
      ...(localPoolGlobal ? { localPool: localPoolGlobal } : {})
    };

    if (coworkerdErr) {
      return successResult({
        healthy: false,
        reachableNodes: 0,
        totalNodes: 0,
        coworkerdError: getFailureSummary(coworkerdErr),
        fallback
      });
    }

    return successResult({
      ...coworkerdGlobal,
      fallback
    });
  }

  async shutdown(timeout?: number): Promise<Result> {
    this.stickyFallbacks.clear();
    this.localPoolRegisteredKeys.clear();
    this.localPoolRegistrations.clear();

    const [[, coworkerdErr], [, localPoolErr]] = await Promise.all([
      this.coworkerd.shutdown(timeout),
      this.localPool.shutdown(timeout)
    ]);

    if (coworkerdErr) return failureResult(coworkerdErr);
    if (localPoolErr) return failureResult(localPoolErr);
    return successResult({});
  }

  async invoke<
    R = unknown,
    S extends boolean = boolean,
    E extends PluginInvokeEventNameType = PluginInvokeEventNameType,
    P = unknown
  >(arg: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    const key = this.key(arg.uniqueId);
    const sticky = this.stickyFallbacks.get(key);
    if (sticky) {
      this.logger.debug('Routing plugin invocation to localPool via cached sticky fallback', {
        pluginId: arg.uniqueId.pluginId,
        version: arg.uniqueId.version,
        etag: arg.uniqueId.etag,
        reason: sticky.reason
      });
      return this.invokeOnLocalPool(arg);
    }

    const [res, err] = await this.coworkerd.invoke<R, S, E, P>(arg);
    if (!err) {
      // Once coworkerd returns a result or StreamData, mid-stream errors are never retried.
      return successResult(res);
    }

    const decision = classifyCoworkerdFallbackError(err);
    if (!decision.eligible) {
      return failureResult(err);
    }

    this.recordFallbackEvent(arg.uniqueId, decision, 'invoke', err);
    return this.invokeOnLocalPool(arg);
  }

  private async invokeOnLocalPool<
    R = unknown,
    S extends boolean = boolean,
    E extends PluginInvokeEventNameType = PluginInvokeEventNameType,
    P = unknown
  >(arg: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    const [, regErr] = await this.ensureLocalPoolRegistered(arg.uniqueId);
    if (regErr) {
      return failureResult(regErr);
    }

    const [res, err] = await this.localPool.invoke<R, S, E, P>(arg);
    if (err) {
      if (err.code === ErrorCode.pluginRuntimePluginNotFound) {
        this.localPoolRegisteredKeys.delete(this.key(arg.uniqueId));
      }
      return failureResult(err);
    }
    return successResult(res);
  }

  private async ensureLocalPoolRegistered(
    uniqueId: PluginUniqueIdType,
    options?: unknown
  ): Promise<Result> {
    const key = this.key(uniqueId);
    if (this.localPoolRegisteredKeys.has(key)) {
      return successResult({});
    }

    const inFlight = this.localPoolRegistrations.get(key);
    if (inFlight) {
      return inFlight;
    }

    const operation = (async (): Promise<Result> => {
      const [res, err] = await this.localPool.register(uniqueId, options as never);
      if (!err) {
        this.localPoolRegisteredKeys.add(key);
        return successResult(res);
      }
      if (err.code === ErrorCode.pluginRuntimeAlreadyRegistered) {
        this.localPoolRegisteredKeys.add(key);
        return successResult({});
      }
      return failureResult(err);
    })();

    this.localPoolRegistrations.set(key, operation);
    try {
      return await operation;
    } finally {
      if (this.localPoolRegistrations.get(key) === operation) {
        this.localPoolRegistrations.delete(key);
      }
    }
  }

  private recordFallbackEvent(
    uniqueId: PluginUniqueIdType,
    decision: Exclude<FallbackDecision, { eligible: false }>,
    phase: 'register' | 'invoke',
    failure: ResultFailure
  ): void {
    const key = this.key(uniqueId);
    const now = new Date().toISOString();
    const message = getFailureSummary(failure);

    if (decision.sticky) {
      const alreadySticky = this.stickyFallbacks.has(key);
      if (!alreadySticky) {
        this.stickyFallbacks.set(key, {
          uniqueId: { ...uniqueId },
          reason: decision.reason,
          message,
          since: now,
          ...(failure.code ? { code: failure.code } : {})
        });
        this.logger.warn(
          'Plugin is statically incompatible with Coworkerd; falling back to localPool (sticky)',
          {
            pluginId: uniqueId.pluginId,
            version: uniqueId.version,
            etag: uniqueId.etag,
            phase,
            reason: decision.reason,
            code: failure.code,
            message
          }
        );
      } else {
        this.logger.debug('Plugin remains in sticky localPool fallback', {
          pluginId: uniqueId.pluginId,
          version: uniqueId.version,
          etag: uniqueId.etag,
          phase,
          reason: decision.reason
        });
      }
    } else {
      this.transientFallbackCount++;
      this.lastTransientFallback = {
        uniqueId: { ...uniqueId },
        reason: decision.reason,
        message,
        at: now,
        ...(failure.code ? { code: failure.code } : {})
      };
      this.logger.warn(
        'Coworkerd cluster is unavailable; falling back to localPool for this call (transient)',
        {
          pluginId: uniqueId.pluginId,
          version: uniqueId.version,
          etag: uniqueId.etag,
          phase,
          reason: decision.reason,
          code: failure.code,
          message
        }
      );
    }

    this.metrics.recordFallback({
      pluginId: uniqueId.pluginId,
      pluginVersion: uniqueId.version,
      pluginEtag: uniqueId.etag,
      runtimeMode: 'coworkerd',
      targetRuntimeMode: 'localPool',
      reason: decision.reason,
      phase,
      sticky: decision.sticky
    });
  }

  private async safeLocalPoolStatus(
    uniqueId: PluginUniqueIdType
  ): Promise<ServiceMetrics | undefined> {
    try {
      const [status, err] = await this.localPool.status(uniqueId);
      return err ? undefined : status;
    } catch {
      return undefined;
    }
  }
}

type ErrorCandidate = {
  raw: unknown;
  code?: string;
  status?: number;
  message?: string;
  telemetryKind?: string;
  data?: Record<string, unknown>;
};

function collectErrorCandidates(failure: ResultFailure): ErrorCandidate[] {
  const candidates: ErrorCandidate[] = [];
  const seen = new Set<unknown>();

  const pushCandidate = (raw: unknown) => {
    if (!raw || seen.has(raw)) return;
    seen.add(raw);

    if (raw instanceof RegisteredError) {
      candidates.push({
        raw,
        code: raw.code,
        status: extractStatus(raw.data),
        message: raw.message,
        telemetryKind: raw.telemetryKind,
        data: raw.data
      });
      return;
    }

    if (raw instanceof Error) {
      const record = raw as Error & { code?: unknown; data?: unknown; telemetryKind?: unknown };
      const data = isRecord(record.data) ? record.data : undefined;
      candidates.push({
        raw,
        code: typeof record.code === 'string' ? record.code : undefined,
        status: extractStatus(data),
        message: raw.message,
        telemetryKind: typeof record.telemetryKind === 'string' ? record.telemetryKind : undefined,
        data
      });
      return;
    }

    if (isRecord(raw)) {
      const data = isRecord(raw.data) ? raw.data : undefined;
      candidates.push({
        raw,
        code: typeof raw.code === 'string' ? raw.code : undefined,
        status: extractStatus(data) ?? (typeof raw.status === 'number' ? raw.status : undefined),
        message: typeof raw.message === 'string' ? raw.message : undefined,
        telemetryKind: typeof raw.telemetryKind === 'string' ? raw.telemetryKind : undefined,
        data
      });
    }
  };

  pushCandidate(failure);

  let current: unknown = failure.error;
  for (let depth = 0; depth < 5 && current; depth++) {
    pushCandidate(current);
    if (current instanceof Error && 'cause' in current) {
      current = current.cause;
    } else if (isRecord(current) && 'cause' in current) {
      current = current.cause;
    } else if (isRecord(current) && 'error' in current) {
      current = current.error;
    } else {
      break;
    }
  }

  return candidates;
}

function isCircuitBreakerOpenCandidate(candidate: ErrorCandidate): boolean {
  if (candidate.data?.circuitBreakerOpen === true) return true;
  if (candidate.telemetryKind === 'circuit_breaker_open') return true;
  const msg = candidate.message?.toLowerCase() ?? '';
  return msg.includes('circuit breaker is open') || msg.includes('circuit breaker is half-open');
}

function isNotFoundFailure(failure: ResultFailure): boolean {
  if (failure.code === ErrorCode.pluginRuntimePluginNotFound || failure.code === 'NOT_FOUND') {
    return true;
  }
  const status = extractStatus(failure.data);
  if (status === 404) {
    return true;
  }
  if (failure.error instanceof RegisteredError) {
    return failure.error.code === ErrorCode.pluginRuntimePluginNotFound;
  }
  return false;
}

function extractStatus(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.status === 'number') return value.status;
  if (isRecord(value.data) && typeof value.data.status === 'number') return value.data.status;
  return undefined;
}

function getFailureSummary(failure: ResultFailure): string {
  return failure.message ?? failure.error?.message ?? failure.reason?.en ?? 'Unknown error';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
