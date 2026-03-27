import type { ServiceConfig } from './types';

export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  minPods: 0,
  maxPods: 5,
  idleTimeout: 60_000,
  podTimeout: 30_000,
  maxRequestsPerPod: 100,
  maxConcurrentRequestsPerPod: 1,
  maxQueueSize: 500
};
