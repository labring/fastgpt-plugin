import type { GlobalMetrics } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/types';

export type RuntimeMode = 'localPool' | 'serverless';

export type RuntimeFailureKind =
  | 'queue_timeout'
  | 'queue_overflow'
  | 'startup_timeout'
  | 'startup_blocked'
  | 'pod_invoke_error'
  | 'pod_crash'
  | 'unknown';

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
};
