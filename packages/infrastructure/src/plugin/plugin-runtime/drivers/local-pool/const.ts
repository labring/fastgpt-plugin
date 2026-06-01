import { env } from '../../../../env';

import type { LocalPoolGlobalServiceConfigType, LocalPoolPluginConfigType } from './types';

export const LOCAL_POOL_DEFAULT_PLUGIN_CONFIG: LocalPoolPluginConfigType = {
  minPods: env.POOL_SERVICE_MIN_PODS,
  maxPods: env.POOL_SERVICE_MAX_PODS,
  podTimeout: env.POOL_SERVICE_POD_TIMEOUT,
  maxConcurrentRequestsPerPod: env.POOL_SERVICE_MAX_CONCURRENT_REQUESTS_PER_POD
} as const;

export const LOCAL_POOL_GLOBAL_SERVICE_CONFIG: LocalPoolGlobalServiceConfigType = {
  idleTimeout: env.POOL_SERVICE_IDLE_TIMEOUT,
  maxRequestsPerPod: env.POOL_SERVICE_MAX_REQUESTS_PER_POD,
  maxQueueSize: env.POOL_SERVICE_MAX_QUEUE_SIZE,
  queueTimeout: env.POOL_SERVICE_QUEUE_TIMEOUT,
  startupRetryBaseDelay: env.POOL_SERVICE_STARTUP_RETRY_BASE_DELAY,
  startupRetryMaxDelay: env.POOL_SERVICE_STARTUP_RETRY_MAX_DELAY
} as const;
