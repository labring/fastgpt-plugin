import { describe, expect, it, vi } from 'vitest';

import { buildAttributes, createRuntimeMetricsRecorder } from './runtime-recorder';

function createMeterMock() {
  const counters: Record<string, ReturnType<typeof vi.fn>> = {};
  const histograms: Record<string, ReturnType<typeof vi.fn>> = {};
  const gauges: Record<string, (result: { observe: ReturnType<typeof vi.fn> }) => void> = {};

  return {
    counters,
    histograms,
    gauges,
    meter: {
      createCounter: vi.fn((name: string) => {
        counters[name] = vi.fn();
        return {
          add: counters[name]
        };
      }),
      createHistogram: vi.fn((name: string) => {
        histograms[name] = vi.fn();
        return {
          record: histograms[name]
        };
      }),
      createObservableGauge: vi.fn((name: string) => ({
        addCallback: (callback: (result: { observe: ReturnType<typeof vi.fn> }) => void) => {
          gauges[name] = callback;
        }
      }))
    }
  };
}

describe('runtime metrics recorder', () => {
  it('keeps default attributes low-cardinality', () => {
    expect(
      buildAttributes(
        {
          runtimeMode: 'localPool',
          pluginId: 'plugin-a',
          pluginVersion: '1.2.3',
          pluginEtag: 'etag-a'
        },
        true,
        false
      )
    ).toEqual({
      'runtime.mode': 'localPool',
      'plugin.id': 'plugin-a',
      'plugin.version': '1.2.3'
    });
  });

  it('records event metrics with bounded failure kind attributes', () => {
    const meterMock = createMeterMock();
    const recorder = createRuntimeMetricsRecorder({
      meter: meterMock.meter as any,
      includePluginVersion: true,
      includePluginEtag: false,
      gaugeSources: () => []
    });

    recorder.recordInvocationStarted({
      runtimeMode: 'localPool',
      pluginId: 'plugin-a',
      pluginVersion: '1.2.3',
      pluginEtag: 'etag-a'
    });
    recorder.recordInvocationFailed({
      runtimeMode: 'localPool',
      pluginId: 'plugin-a',
      pluginVersion: '1.2.3',
      pluginEtag: 'etag-a',
      failureKind: 'queue_timeout'
    });
    recorder.recordInvocationCompleted({
      runtimeMode: 'localPool',
      pluginId: 'plugin-a',
      pluginVersion: '1.2.3',
      pluginEtag: 'etag-a',
      durationMs: 42
    });

    expect(meterMock.counters['fastgpt.plugin.runtime.invocations.started']).toHaveBeenCalledWith(
      1,
      {
        'runtime.mode': 'localPool',
        'plugin.id': 'plugin-a',
        'plugin.version': '1.2.3'
      }
    );
    expect(meterMock.counters['fastgpt.plugin.runtime.invocations.failed']).toHaveBeenCalledWith(
      1,
      {
        'runtime.mode': 'localPool',
        'plugin.id': 'plugin-a',
        'plugin.version': '1.2.3',
        'failure.kind': 'queue_timeout'
      }
    );
    expect(meterMock.histograms['fastgpt.plugin.runtime.invocation.duration']).toHaveBeenCalledWith(
      42,
      {
        'runtime.mode': 'localPool',
        'plugin.id': 'plugin-a',
        'plugin.version': '1.2.3'
      }
    );
  });

  it('observes state gauges from lazy runtime sources', () => {
    const meterMock = createMeterMock();
    createRuntimeMetricsRecorder({
      meter: meterMock.meter as any,
      includePluginVersion: true,
      includePluginEtag: false,
      gaugeSources: () => [
        {
          runtimeMode: 'localPool',
          getGlobalMetrics: () => ({
            totalServices: 1,
            totalPods: 3,
            totalRequests: 8,
            services: {
              'localPool@plugin-a@1.2.3@etag-a': {
                pods: {
                  total: 3,
                  running: 2,
                  busy: 1,
                  idle: 1,
                  pending: 1
                },
                queueLength: 4,
                responseTime: {
                  avg: 10,
                  p95: 20
                },
                rps: 1,
                errorRate: 0,
                crashCount: 0,
                totalRequests: 8,
                minPods: 1,
                maxPods: 5
              }
            }
          })
        }
      ]
    });

    const observe = vi.fn();
    meterMock.gauges['fastgpt.plugin.runtime.pods']({ observe });
    meterMock.gauges['fastgpt.plugin.runtime.queue.length']({ observe });
    meterMock.gauges['fastgpt.plugin.runtime.services']({ observe });

    expect(observe).toHaveBeenCalledWith(3, {
      'runtime.mode': 'localPool',
      'plugin.id': 'plugin-a',
      'plugin.version': '1.2.3',
      state: 'total'
    });
    expect(observe).toHaveBeenCalledWith(4, {
      'runtime.mode': 'localPool',
      'plugin.id': 'plugin-a',
      'plugin.version': '1.2.3'
    });
    expect(observe).toHaveBeenCalledWith(1, {
      'runtime.mode': 'localPool'
    });
  });
});
