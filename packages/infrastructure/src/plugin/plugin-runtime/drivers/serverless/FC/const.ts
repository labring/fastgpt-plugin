import { env } from '../../../../../env';

import type { FCPluginConfigType } from './types';

export const FC_DEFAULT_PLUGIN_CONFIG: FCPluginConfigType = {
  minInstances: 0,
  maxConcurrency: env.FC_DEFAULT_INSTANCE_CONCURRENCY,
  timeoutMs: env.FC_DEFAULT_TIMEOUT_MS,
  memorySize: env.FC_DEFAULT_MEMORY_SIZE,
  diskSize: env.FC_DEFAULT_DISK_SIZE,
  cpu: env.FC_DEFAULT_CPU,
  reservedConcurrency: undefined,
  provisionedConcurrency: undefined,
  maxQueueSize: env.FC_DEFAULT_MAX_QUEUE_SIZE,
  queueTimeoutMs: env.FC_DEFAULT_QUEUE_TIMEOUT_MS,
  invocationMode: env.FC_INVOCATION_MODE
};

export const FC_REQUEST_PROTOCOL = 'fastgpt-plugin-fc/v1';
export const FC_DEFAULT_HTTP_PATH = '/invoke';
export const FC_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;
