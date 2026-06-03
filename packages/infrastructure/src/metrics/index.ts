import { randomUUID } from 'node:crypto';
import os from 'node:os';

import {
  configureMetrics as configureOtelMetrics,
  disposeMetrics,
  getMeter
} from '@fastgpt-sdk/otel/metrics';

import { env } from '../env';
import { getLogger, infra } from '../logger';

import { createNoopRuntimeMetricsRecorder, createRuntimeMetricsRecorder } from './runtime-recorder';
import type { RuntimeGaugeSource, RuntimeMetricsRecorder } from './runtime-types';

type ResourceLike = {
  attributes: Record<string, string>;
  asyncAttributesPending?: false;
  waitForAsyncAttributes(): Promise<void>;
  getRawAttributes(): Array<[string, string]>;
  merge(other: ResourceLike | null): ResourceLike;
};

const INSTANCE_ID_PREFIX = 'fastgpt-plugin-';

const generatedServiceInstanceId = `${INSTANCE_ID_PREFIX}${randomUUID()}`;
const gaugeSources: RuntimeGaugeSource[] = [];

let configured = false;
let runtimeMetricsRecorder: RuntimeMetricsRecorder = createNoopRuntimeMetricsRecorder();

export async function configureMetrics(): Promise<void> {
  if (configured) {
    return;
  }

  if (!env.METRICS_ENABLE_OTEL) {
    runtimeMetricsRecorder = createNoopRuntimeMetricsRecorder();
    configured = true;
    return;
  }

  const logger = getLogger(infra.otel);

  await configureOtelMetrics({
    defaultMeterName: env.METRICS_OTEL_SERVICE_NAME,
    metrics: {
      enabled: true,
      serviceName: env.METRICS_OTEL_SERVICE_NAME,
      url: env.METRICS_OTEL_URL,
      exportIntervalMillis: env.METRICS_EXPORT_INTERVAL_MS,
      additionalResource: createResource({
        'service.instance.id': getServiceInstanceId(),
        'deployment.environment': getOptionalEnvText(env.DEPLOYMENT_ENVIRONMENT) ?? env.NODE_ENV,
        ...(env.METRICS_INCLUDE_HOSTNAME
          ? { 'host.name': getOptionalEnvText(env.HOSTNAME) ?? os.hostname() }
          : {})
      })
    }
  });

  runtimeMetricsRecorder = createRuntimeMetricsRecorder({
    meter: getMeter(env.METRICS_OTEL_SERVICE_NAME),
    includePluginVersion: env.METRICS_INCLUDE_PLUGIN_VERSION,
    includePluginEtag: env.METRICS_INCLUDE_PLUGIN_ETAG,
    gaugeSources: () => [...gaugeSources],
    onError: (message, error) => {
      logger.warn(message, { error });
    }
  });
  configured = true;
}

export async function destroyMetrics(): Promise<void> {
  if (!configured) {
    return;
  }

  try {
    await withTimeout(disposeMetrics(), env.METRICS_EXPORT_TIMEOUT_MS);
  } finally {
    configured = false;
    runtimeMetricsRecorder = createNoopRuntimeMetricsRecorder();
    gaugeSources.splice(0);
  }
}

export function getRuntimeMetrics(): RuntimeMetricsRecorder {
  return runtimeMetricsRecorder;
}

export function registerRuntimeGaugeSource(source: RuntimeGaugeSource): () => void {
  gaugeSources.push(source);

  return () => {
    const index = gaugeSources.indexOf(source);
    if (index >= 0) {
      gaugeSources.splice(index, 1);
    }
  };
}

export function getServiceInstanceId(): string {
  return getOptionalEnvText(env.SERVICE_INSTANCE_ID) ?? generatedServiceInstanceId;
}

export function __getRuntimeGaugeSourcesForTest(): RuntimeGaugeSource[] {
  return [...gaugeSources];
}

export function __setRuntimeMetricsRecorderForTest(recorder: RuntimeMetricsRecorder): () => void {
  const previous = runtimeMetricsRecorder;
  runtimeMetricsRecorder = recorder;

  return () => {
    runtimeMetricsRecorder = previous;
  };
}

function createResource(attributes: Record<string, string>): ResourceLike {
  return {
    attributes,
    asyncAttributesPending: false,
    async waitForAsyncAttributes() {},
    getRawAttributes() {
      return Object.entries(attributes);
    },
    merge(other) {
      if (!other) {
        return this;
      }

      return createResource({
        ...attributes,
        ...other.attributes
      });
    }
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`Metrics shutdown timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        timeout.unref?.();
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function getOptionalEnvText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export type {
  RuntimeFailureKind,
  RuntimeGaugeSource,
  RuntimeMetricAttributes,
  RuntimeMetricsRecorder
} from './runtime-types';
