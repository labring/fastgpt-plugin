import type { getMeter } from '@fastgpt-sdk/otel/metrics';

import type {
  ConnectionGatewayGaugeSource,
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
  connectionGatewayGaugeSources?: () => ConnectionGatewayGaugeSource[];
  onError?: (message: string, error: unknown) => void;
};

export function createRuntimeMetricsRecorder({
  meter,
  includePluginVersion,
  includePluginEtag,
  gaugeSources,
  connectionGatewayGaugeSources = () => [],
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
  registerConnectionGatewayGauges({ meter, gaugeSources: connectionGatewayGaugeSources, onError });

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

function registerConnectionGatewayGauges({
  meter,
  gaugeSources,
  onError
}: {
  meter: Meter;
  gaugeSources: () => ConnectionGatewayGaugeSource[];
  onError?: (message: string, error: unknown) => void;
}): void {
  const gauges: Array<{
    name: string;
    unit: string;
    read: (source: ReturnType<ConnectionGatewayGaugeSource['getConnectionGatewayMetrics']>) => number;
  }> = [
    {
      name: 'fastgpt.plugin.connection_gateway.connections.active',
      unit: '{connection}',
      read: (metrics) => metrics.activeConnections
    },
    {
      name: 'fastgpt.plugin.connection_gateway.sessions.active',
      unit: '{session}',
      read: (metrics) => metrics.activeSessions
    },
    {
      name: 'fastgpt.plugin.connection_gateway.requests.in_flight',
      unit: '{request}',
      read: (metrics) => metrics.inFlightRequests
    },
    {
      name: 'fastgpt.plugin.connection_gateway.stream.buffer.bytes',
      unit: 'By',
      read: (metrics) => metrics.streamBufferBytes
    },
    {
      name: 'fastgpt.plugin.connection_gateway.consumers.slow',
      unit: '{consumer}',
      read: (metrics) => metrics.slowConsumers
    },
    {
      name: 'fastgpt.plugin.connection_gateway.owner_lease.expiries',
      unit: '{expiry}',
      read: (metrics) => metrics.ownerLeaseExpiries
    },
    {
      name: 'fastgpt.plugin.connection_gateway.mailbox.lag',
      unit: '{message}',
      read: (metrics) => metrics.mailbox.lag
    },
    {
      name: 'fastgpt.plugin.connection_gateway.mailbox.redis_round_trip',
      unit: 'ms',
      read: (metrics) => metrics.mailbox.redisRoundTripMs
    },
    {
      name: 'fastgpt.plugin.connection_gateway.limit.connections.max',
      unit: '{connection}',
      read: (metrics) => metrics.limits.maxConnections
    },
    {
      name: 'fastgpt.plugin.connection_gateway.limit.sessions_per_subject.max',
      unit: '{session}',
      read: (metrics) => metrics.limits.maxSessionsPerSubject
    },
    {
      name: 'fastgpt.plugin.connection_gateway.limit.in_flight_per_session.max',
      unit: '{request}',
      read: (metrics) => metrics.limits.maxInFlightPerSession
    },
    {
      name: 'fastgpt.plugin.connection_gateway.limit.envelope.bytes',
      unit: 'By',
      read: (metrics) => metrics.limits.maxEnvelopeBytes
    }
  ];

  for (const gauge of gauges) {
    meter.createObservableGauge(gauge.name, { unit: gauge.unit }).addCallback((result) => {
      observeConnectionGatewayMetric({ result, gaugeSources, gauge, onError });
    });
  }
}

function observeConnectionGatewayMetric({
  result,
  gaugeSources,
  gauge,
  onError
}: {
  result: ObservableResult;
  gaugeSources: () => ConnectionGatewayGaugeSource[];
  gauge: {
    name: string;
    read: (source: ReturnType<ConnectionGatewayGaugeSource['getConnectionGatewayMetrics']>) => number;
  };
  onError?: (message: string, error: unknown) => void;
}): void {
  for (const source of gaugeSources()) {
    try {
      const metrics = source.getConnectionGatewayMetrics();
      result.observe(gauge.read(metrics), {
        'gateway.node_id': metrics.nodeId
      });
    } catch (error) {
      onError?.(`Failed to observe ${gauge.name}`, error);
    }
  }
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
