import { env } from '../../../../env';

import type { LocalPoolPluginConfigType } from './types';

export const LOCAL_POOL_DEFAULT_SERVICE_CONFIG: LocalPoolPluginConfigType = {
  minPods: env.POOL_SERVICE_MIN_PODS,
  maxPods: env.POOL_SERVICE_MAX_PODS,
  idleTimeout: env.POOL_SERVICE_IDLE_TIMEOUT,
  podTimeout: env.POOL_SERVICE_POD_TIMEOUT,
  maxRequestsPerPod: env.POOL_SERVICE_MAX_REQUESTS_PER_POD,
  maxConcurrentRequestsPerPod: env.POOL_SERVICE_MAX_CONCURRENT_REQUESTS_PER_POD,
  maxQueueSize: env.POOL_SERVICE_MAX_QUEUE_SIZE,
  queueTimeout: env.POOL_SERVICE_QUEUE_TIMEOUT
} as const;
