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

type MetricsEnv = {
  NODE_ENV: 'development' | 'production' | 'test';
  METRICS_ENABLE_OTEL: boolean;
  METRICS_OTEL_SERVICE_NAME: string;
  METRICS_OTEL_URL: string;
  METRICS_EXPORT_INTERVAL_MS: number;
  METRICS_EXPORT_TIMEOUT_MS: number;
  METRICS_INCLUDE_PLUGIN_VERSION: boolean;
  METRICS_INCLUDE_PLUGIN_ETAG: boolean;
  METRICS_INCLUDE_HOSTNAME: boolean;
  SERVICE_INSTANCE_ID?: string;
  DEPLOYMENT_ENVIRONMENT?: string;
  HOSTNAME?: string;
};

let configured = false;
let configuredEnv: MetricsEnv = env;
let runtimeMetricsRecorder: RuntimeMetricsRecorder = createNoopRuntimeMetricsRecorder();

export async function configureMetrics(runtimeEnv: MetricsEnv = env): Promise<void> {
  if (configured) {
    return;
  }

  configuredEnv = runtimeEnv;

  if (!runtimeEnv.METRICS_ENABLE_OTEL) {
    runtimeMetricsRecorder = createNoopRuntimeMetricsRecorder();
    configured = true;
    return;
  }

  const logger = getLogger(infra.otel);

  await configureOtelMetrics({
    defaultMeterName: runtimeEnv.METRICS_OTEL_SERVICE_NAME,
    metrics: {
      enabled: true,
      serviceName: runtimeEnv.METRICS_OTEL_SERVICE_NAME,
      url: runtimeEnv.METRICS_OTEL_URL,
      exportIntervalMillis: runtimeEnv.METRICS_EXPORT_INTERVAL_MS,
      additionalResource: createResource({
        'service.instance.id': getServiceInstanceId(),
        'deployment.environment':
          getOptionalEnvText(runtimeEnv.DEPLOYMENT_ENVIRONMENT) ?? runtimeEnv.NODE_ENV,
        ...(runtimeEnv.METRICS_INCLUDE_HOSTNAME
          ? { 'host.name': getOptionalEnvText(runtimeEnv.HOSTNAME) ?? os.hostname() }
          : {})
      })
    }
  });

  runtimeMetricsRecorder = createRuntimeMetricsRecorder({
    meter: getMeter(runtimeEnv.METRICS_OTEL_SERVICE_NAME),
    includePluginVersion: runtimeEnv.METRICS_INCLUDE_PLUGIN_VERSION,
    includePluginEtag: runtimeEnv.METRICS_INCLUDE_PLUGIN_ETAG,
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
    await withTimeout(disposeMetrics(), configuredEnv.METRICS_EXPORT_TIMEOUT_MS);
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
  return getOptionalEnvText(configuredEnv.SERVICE_INSTANCE_ID) ?? generatedServiceInstanceId;
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
