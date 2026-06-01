import type { Mutex } from 'es-toolkit';
import z from 'zod';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { InvokePort } from '@domain/ports/invoke.port';

import type { PluginService } from './service/index';
export type { PodInfo, PodStatus } from './pod/type';

export type LocalPoolPluginItemType = {
  filePath: string; // for loading the .js file to execute
  config: LocalPoolPluginConfigType;
  service: PluginService;
  meta: PluginType;
  mutex: Mutex;
};

const LocalPoolPluginConfigBaseSchema = z.object({
  minPods: z.number().nonnegative(),
  maxPods: z.number().positive(),
  podTimeout: z.number().positive(),
  maxConcurrentRequestsPerPod: z.number().positive()
});

export const LocalPoolPluginConfigSchema = LocalPoolPluginConfigBaseSchema.refine(
  (config) => config.minPods <= config.maxPods,
  {
    message: 'minPods cannot be greater than maxPods',
    path: ['minPods']
  }
);

export type LocalPoolPluginConfigType = z.infer<typeof LocalPoolPluginConfigSchema>;

export const LocalPoolGlobalServiceConfigSchema = z
  .object({
    idleTimeout: z.number().positive(),
    maxRequestsPerPod: z.number().nonnegative(),
    maxQueueSize: z.number().positive(),
    queueTimeout: z.number().nonnegative(),
    startupRetryBaseDelay: z.number().positive(),
    startupRetryMaxDelay: z.number().positive()
  })
  .refine((config) => config.startupRetryBaseDelay <= config.startupRetryMaxDelay, {
    message: 'startupRetryBaseDelay cannot be greater than startupRetryMaxDelay',
    path: ['startupRetryBaseDelay']
  });

export type LocalPoolGlobalServiceConfigType = z.infer<typeof LocalPoolGlobalServiceConfigSchema>;

export const LocalPoolServiceConfigSchema = LocalPoolPluginConfigBaseSchema.merge(
  LocalPoolGlobalServiceConfigSchema
)
  .refine((config) => config.minPods <= config.maxPods, {
    message: 'minPods cannot be greater than maxPods',
    path: ['minPods']
  })
  .refine((config) => config.startupRetryBaseDelay <= config.startupRetryMaxDelay, {
    message: 'startupRetryBaseDelay cannot be greater than startupRetryMaxDelay',
    path: ['startupRetryBaseDelay']
  });

export type LocalPoolServiceConfigType = z.infer<typeof LocalPoolServiceConfigSchema>;

export const LocalPoolGlobalConfigSchema = z.object({
  maxTotalPods: z.number().nonnegative(),
  healthCheckInterval: z.number().nonnegative()
});

export type LocalPoolGlobalConfigType = z.infer<typeof LocalPoolGlobalConfigSchema>;

// ============ 调用选项 ============

export interface InvokeOptions {
  timeout?: number;
  invocationId?: string;
  priority?: number;
  invoke?: InvokePort;
}

// ============ 监控指标类型 ============

export interface PodStats {
  total: number;
  running: number;
  busy: number;
  idle: number;
  /** 正在启动中（已 fork、尚未发送 ready）的 Pod 数量 */
  pending: number;
}

export interface ResponseTimeStats {
  avg: number;
  p95: number;
  p99?: number;
}

export interface ServiceMetrics {
  pods: PodStats;
  queueLength: number;
  responseTime: ResponseTimeStats;
  rps: number;
  errorRate: number;
  crashCount: number;
  totalRequests: number;
  minPods?: number;
  maxPods?: number;
}

export interface GlobalMetrics {
  totalServices: number;
  totalPods: number;
  totalRequests: number;
  // errorRate: number;
  services: Record<string, ServiceMetrics>;
}

// ============ 销毁选项 ============

export interface DestroyOptions {
  force?: boolean;
  timeout?: number;
}

// ============ 事件类型 ============

export interface LocalPoolRuntimeCallbacks {
  onPluginUnregistered?: (pluginId: string) => void;
  onPluginUnhealthy?: (pluginId: string, reason: string) => void;
  onQuotaExceeded?: (current: number, max: number) => void;
  onHealthCheck?: (plugins: string[]) => void;
}

export interface PluginServiceCallbacks {
  onPodCreated?: () => void;
  onRequestCompleted?: (payload: { requestId: string; duration: number }) => void;
  onRequestFailed?: (payload: { requestId: string; error: unknown }) => void;
  onPodLog?: (event: { podId: string; level: 'debug' | 'error'; message: string }) => void;
}
