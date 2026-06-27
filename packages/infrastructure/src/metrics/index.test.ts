import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env;
const otelMetricsMock = vi.hoisted(() => ({
  configureMetrics: vi.fn(async () => {}),
  disposeMetrics: vi.fn(async () => {}),
  getMeter: vi.fn(() => ({
    createCounter: vi.fn(() => ({
      add: vi.fn()
    })),
    createHistogram: vi.fn(() => ({
      record: vi.fn()
    })),
    createObservableGauge: vi.fn(() => ({
      addCallback: vi.fn()
    }))
  }))
}));

vi.mock('@fastgpt-sdk/otel/metrics', () => otelMetricsMock);

function resetEnv() {
  process.env = {
    ...originalEnv,
    METRICS_ENABLE_OTEL: 'false',
    METRICS_INCLUDE_HOSTNAME: 'true'
  };
  delete process.env.SERVICE_INSTANCE_ID;
  delete process.env.DEPLOYMENT_ENVIRONMENT;
}

describe('metrics facade', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
    otelMetricsMock.configureMetrics.mockReset();
    otelMetricsMock.configureMetrics.mockResolvedValue(undefined);
    otelMetricsMock.disposeMetrics.mockReset();
    otelMetricsMock.disposeMetrics.mockResolvedValue(undefined);
    otelMetricsMock.getMeter.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('is noop and idempotent when metrics are disabled', async () => {
    const metrics = await import('./index');

    await metrics.configureMetrics();
    await metrics.configureMetrics();

    expect(() =>
      metrics.getRuntimeMetrics().recordInvocationStarted({
        runtimeMode: 'localPool',
        pluginId: 'plugin-a'
      })
    ).not.toThrow();

    await metrics.destroyMetrics();
    await metrics.destroyMetrics();
  });

  it('registers gauge sources lazily and unregisters them', async () => {
    const metrics = await import('./index');
    const source = {
      runtimeMode: 'localPool' as const,
      getGlobalMetrics: () => ({
        totalServices: 0,
        totalPods: 0,
        totalRequests: 0,
        services: {}
      })
    };

    const unregister = metrics.registerRuntimeGaugeSource(source);

    expect(metrics.__getRuntimeGaugeSourcesForTest()).toEqual([source]);

    unregister();

    expect(metrics.__getRuntimeGaugeSourcesForTest()).toEqual([]);
  });

  it('registers connection gateway gauge sources lazily and unregisters them', async () => {
    const metrics = await import('./index');
    const source = {
      getConnectionGatewayMetrics: () => ({
        nodeId: 'node-a',
        activeConnections: 1,
        activeSessions: 2,
        inFlightRequests: 3,
        streamBufferBytes: 4,
        slowConsumers: 5,
        ownerLeaseExpiries: 6,
        mailbox: {
          lag: 7,
          redisRoundTripMs: 8
        },
        limits: {
          maxConnections: 100,
          maxSessionsPerSubject: 5,
          maxInFlightPerSession: 50,
          maxEnvelopeBytes: 1024
        }
      })
    };

    const unregister = metrics.registerConnectionGatewayGaugeSource(source);

    expect(metrics.__getConnectionGatewayGaugeSourcesForTest()).toEqual([source]);

    unregister();

    expect(metrics.__getConnectionGatewayGaugeSourcesForTest()).toEqual([]);
  });

  it('clears connection gateway gauge sources on destroy', async () => {
    process.env.METRICS_ENABLE_OTEL = 'true';
    const metrics = await import('./index');
    metrics.registerConnectionGatewayGaugeSource({
      getConnectionGatewayMetrics: () => ({
        nodeId: 'node-a',
        activeConnections: 0,
        activeSessions: 0,
        inFlightRequests: 0,
        streamBufferBytes: 0,
        slowConsumers: 0,
        ownerLeaseExpiries: 0,
        mailbox: {
          lag: 0,
          redisRoundTripMs: 0
        },
        limits: {
          maxConnections: 1,
          maxSessionsPerSubject: 1,
          maxInFlightPerSession: 1,
          maxEnvelopeBytes: 1
        }
      })
    });

    await metrics.configureMetrics();
    await metrics.destroyMetrics();

    expect(metrics.__getConnectionGatewayGaugeSourcesForTest()).toEqual([]);
  });

  it('generates an opaque service instance id when env override is absent', async () => {
    const metrics = await import('./index');

    expect(metrics.getServiceInstanceId()).toMatch(/^fastgpt-plugin-/);
  });

  it('ignores blank service instance id overrides', async () => {
    process.env.SERVICE_INSTANCE_ID = '   ';

    const metrics = await import('./index');

    expect(metrics.getServiceInstanceId()).toMatch(/^fastgpt-plugin-/);
  });

  it('passes stable resource attributes through the otel sdk facade', async () => {
    process.env.METRICS_ENABLE_OTEL = 'true';
    process.env.SERVICE_INSTANCE_ID = 'pod-a';
    process.env.DEPLOYMENT_ENVIRONMENT = 'staging';
    process.env.HOSTNAME = 'host-a';

    const metrics = await import('./index');

    await metrics.configureMetrics();

    const config = (otelMetricsMock.configureMetrics as any).mock.calls[0][0];
    const additionalResource = config.metrics.additionalResource;

    expect(config).toMatchObject({
      defaultMeterName: 'fastgpt-plugin',
      metrics: {
        enabled: true,
        serviceName: 'fastgpt-plugin',
        url: 'http://localhost:4318/v1/metrics',
        exportIntervalMillis: 30_000
      }
    });
    expect(Object.fromEntries(additionalResource.getRawAttributes())).toEqual({
      'deployment.environment': 'staging',
      'host.name': 'host-a',
      'service.instance.id': 'pod-a'
    });
  });

  it('bounds metrics shutdown by the export timeout', async () => {
    vi.useFakeTimers();
    process.env.METRICS_ENABLE_OTEL = 'true';
    process.env.METRICS_EXPORT_TIMEOUT_MS = '10';
    otelMetricsMock.disposeMetrics.mockImplementationOnce(() => new Promise(() => {}));

    const metrics = await import('./index');

    await metrics.configureMetrics();
    const shutdown = metrics.destroyMetrics();
    const shutdownError = expect(shutdown).rejects.toThrow('Metrics shutdown timed out after 10ms');
    await vi.advanceTimersByTimeAsync(10);

    await shutdownError;
    vi.useRealTimers();
  });
});
