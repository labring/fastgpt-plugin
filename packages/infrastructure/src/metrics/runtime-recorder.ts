import type { getMeter } from '@fastgpt-sdk/otel/metrics';

import type {
  RuntimeGaugeSource,
  RuntimeMetricAttributes,
  RuntimeMetricsRecorder
} from './runtime-types';

type Meter = ReturnType<typeof getMeter>;
type ObservableResult = {
  observe(value: number, attributes?: Record<string, string>): void;
};

export type RuntimeMetricsRecorderOptions = {
  meter: Meter;
  includePluginVersion: boolean;
  includePluginEtag: boolean;
  gaugeSources: () => RuntimeGaugeSource[];
  onError?: (message: string, error: unknown) => void;
};

export function createRuntimeMetricsRecorder({
  meter,
  includePluginVersion,
  includePluginEtag,
  gaugeSources,
  onError
}: RuntimeMetricsRecorderOptions): RuntimeMetricsRecorder {
  const invocationsStarted = meter.createCounter('fastgpt.plugin.runtime.invocations.started', {
    unit: '{invocation}'
  });
  const invocationsFailed = meter.createCounter('fastgpt.plugin.runtime.invocations.failed', {
    unit: '{invocation}'
  });
  const invocationDuration = meter.createHistogram('fastgpt.plugin.runtime.invocation.duration', {
    unit: 'ms'
  });
  const podCrashes = meter.createCounter('fastgpt.plugin.runtime.pod.crashes', {
    unit: '{crash}'
  });
  const podStartups = meter.createCounter('fastgpt.plugin.runtime.pod.startups', {
    unit: '{pod}'
  });

  meter
    .createObservableGauge('fastgpt.plugin.runtime.pods', { unit: '{pod}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError
      });
    });
  meter
    .createObservableGauge('fastgpt.plugin.runtime.queue.length', { unit: '{request}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError,
        stateMetric: 'queue'
      });
    });
  meter
    .createObservableGauge('fastgpt.plugin.runtime.service.min_pods', { unit: '{pod}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError,
        stateMetric: 'minPods'
      });
    });
  meter
    .createObservableGauge('fastgpt.plugin.runtime.service.max_pods', { unit: '{pod}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError,
        stateMetric: 'maxPods'
      });
    });
  meter
    .createObservableGauge('fastgpt.plugin.runtime.services', { unit: '{service}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError,
        stateMetric: 'services'
      });
    });
  meter
    .createObservableGauge('fastgpt.plugin.runtime.total_pods', { unit: '{pod}' })
    .addCallback((result) => {
      observeRuntimeState({
        result,
        gaugeSources,
        includePluginVersion,
        includePluginEtag,
        onError,
        stateMetric: 'totalPods'
      });
    });

  return {
    recordInvocationStarted(attributes) {
      safelyRecord(onError, 'record invocation started metrics', () => {
        invocationsStarted.add(
          1,
          buildAttributes(attributes, includePluginVersion, includePluginEtag)
        );
      });
    },
    recordInvocationCompleted(attributes) {
      safelyRecord(onError, 'record invocation duration metrics', () => {
        invocationDuration.record(
          attributes.durationMs,
          buildAttributes(attributes, includePluginVersion, includePluginEtag)
        );
      });
    },
    recordInvocationFailed(attributes) {
      safelyRecord(onError, 'record invocation failure metrics', () => {
        invocationsFailed.add(1, {
          ...buildAttributes(attributes, includePluginVersion, includePluginEtag),
          'failure.kind': attributes.failureKind
        });
      });
    },
    recordPodCrash(attributes) {
      safelyRecord(onError, 'record pod crash metrics', () => {
        podCrashes.add(1, buildAttributes(attributes, includePluginVersion, includePluginEtag));
      });
    },
    recordPodStartup(attributes) {
      safelyRecord(onError, 'record pod startup metrics', () => {
        podStartups.add(1, {
          ...buildAttributes(attributes, includePluginVersion, includePluginEtag),
          outcome: attributes.outcome
        });
      });
    }
  };
}

export function createNoopRuntimeMetricsRecorder(): RuntimeMetricsRecorder {
  return {
    recordInvocationStarted() {},
    recordInvocationCompleted() {},
    recordInvocationFailed() {},
    recordPodCrash() {},
    recordPodStartup() {}
  };
}

export function buildAttributes(
  attributes: RuntimeMetricAttributes,
  includePluginVersion: boolean,
  includePluginEtag: boolean
): Record<string, string> {
  const result: Record<string, string> = {
    'runtime.mode': attributes.runtimeMode
  };

  if (attributes.pluginId) {
    result['plugin.id'] = attributes.pluginId;
  }
  if (includePluginVersion && attributes.pluginVersion) {
    result['plugin.version'] = attributes.pluginVersion;
  }
  if (includePluginEtag && attributes.pluginEtag) {
    result['plugin.etag'] = attributes.pluginEtag;
  }

  return result;
}

type StateMetric = 'pods' | 'queue' | 'minPods' | 'maxPods' | 'services' | 'totalPods';

function observeRuntimeState({
  result,
  gaugeSources,
  includePluginVersion,
  includePluginEtag,
  onError,
  stateMetric = 'pods'
}: {
  result: ObservableResult;
  gaugeSources: () => RuntimeGaugeSource[];
  includePluginVersion: boolean;
  includePluginEtag: boolean;
  onError?: (message: string, error: unknown) => void;
  stateMetric?: StateMetric;
}): void {
  for (const source of gaugeSources()) {
    try {
      const metrics = source.getGlobalMetrics();

      if (stateMetric === 'services') {
        result.observe(metrics.totalServices, { 'runtime.mode': source.runtimeMode });
        continue;
      }
      if (stateMetric === 'totalPods') {
        result.observe(metrics.totalPods, { 'runtime.mode': source.runtimeMode });
        continue;
      }

      for (const [runtimeId, serviceMetrics] of Object.entries(metrics.services)) {
        const baseAttributes = buildAttributes(
          parseRuntimeId(runtimeId, source.runtimeMode),
          includePluginVersion,
          includePluginEtag
        );

        if (stateMetric === 'queue') {
          result.observe(serviceMetrics.queueLength, baseAttributes);
          continue;
        }
        if (stateMetric === 'minPods') {
          result.observe(serviceMetrics.minPods ?? 0, baseAttributes);
          continue;
        }
        if (stateMetric === 'maxPods') {
          result.observe(serviceMetrics.maxPods ?? 0, baseAttributes);
          continue;
        }

        result.observe(serviceMetrics.pods.total, { ...baseAttributes, state: 'total' });
        result.observe(serviceMetrics.pods.running, { ...baseAttributes, state: 'running' });
        result.observe(serviceMetrics.pods.busy, { ...baseAttributes, state: 'busy' });
        result.observe(serviceMetrics.pods.idle, { ...baseAttributes, state: 'idle' });
        result.observe(serviceMetrics.pods.pending, { ...baseAttributes, state: 'pending' });
      }
    } catch (error) {
      onError?.('Failed to observe runtime metrics', error);
    }
  }
}

function parseRuntimeId(
  runtimeId: string,
  fallbackRuntimeMode: RuntimeMetricAttributes['runtimeMode']
) {
  const [runtimeMode, pluginId, pluginVersion, pluginEtag] = runtimeId.split('@');

  return {
    runtimeMode:
      runtimeMode === 'localPool' || runtimeMode === 'serverless'
        ? runtimeMode
        : fallbackRuntimeMode,
    pluginId,
    pluginVersion,
    pluginEtag
  } satisfies RuntimeMetricAttributes;
}

function safelyRecord(
  onError: ((message: string, error: unknown) => void) | undefined,
  message: string,
  record: () => void
): void {
  try {
    record();
  } catch (error) {
    onError?.(message, error);
  }
}
