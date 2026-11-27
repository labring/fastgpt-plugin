import type { ConnectionGatewayMetrics } from '@domain/value-objects/connection-gateway.vo';
import type { GlobalMetrics } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/types';

export type RuntimeMode = 'localPool' | 'serverless' | 'coworkerd';

export type RuntimeFailureKind =
  | 'queue_timeout'
  | 'queue_overflow'
  | 'startup_timeout'
  | 'startup_blocked'
  | 'pod_invoke_error'
  | 'pod_crash'
  | 'cpu_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'trial_load_failed'
  | 'circuit_breaker_open'
  | 'cluster_unavailable'
  | 'unknown';

export type RuntimeFallbackReason =
  | 'artifact_build_failed'
  | 'trial_load_failed'
  | 'circuit_breaker_open'
  | 'cluster_unavailable';

export type RuntimeMetricAttributes = {
  pluginId?: string;
  pluginVersion?: string;
  pluginEtag?: string;
  runtimeMode: RuntimeMode;
};

export type RuntimeGaugeSource = {
  runtimeMode: RuntimeMode;
  getGlobalMetrics: () => GlobalMetrics;
};

export type ConnectionGatewayGaugeSource = {
  getConnectionGatewayMetrics: () => ConnectionGatewayMetrics;
};

export type RuntimeMetricsRecorder = {
  recordInvocationStarted(attributes: RuntimeMetricAttributes): void;
  recordInvocationCompleted(attributes: RuntimeMetricAttributes & { durationMs: number }): void;
  recordInvocationFailed(
    attributes: RuntimeMetricAttributes & { failureKind: RuntimeFailureKind }
  ): void;
  recordPodCrash(attributes: RuntimeMetricAttributes): void;
  recordPodStartup(
    attributes: RuntimeMetricAttributes & { outcome: 'success' | 'failure' | 'timeout' }
  ): void;
  recordFallback(
    attributes: RuntimeMetricAttributes & {
      targetRuntimeMode: RuntimeMode;
      reason: RuntimeFallbackReason;
      phase: 'register' | 'invoke';
      sticky: boolean;
    }
  ): void;
};
