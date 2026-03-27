import z from 'zod';

export const PoolServiceConfigSchema = z.object({
  minPods: z.number().nonnegative(),
  maxPods: z.number().nonnegative(),
  idleTimeout: z.number().nonnegative(),
  podTimeout: z.number().nonnegative(),
  maxRequestsPerPod: z.number().nonnegative(),
  maxQueueSize: z.number().nonnegative(),
  queueTimeout: z.number().nonnegative()
});

export type PoolServiceConfigType = z.infer<typeof PoolServiceConfigSchema>;

export const PoolConfigSchema = z.object({
  maxTotalPods: z.number().nonnegative()
});

/**
 * 全局配置
 */
export interface GlobalConfig {
  /** 全局最大 Pod 总数（跨所有插件） */
  maxTotalPods: number;
  /** 健康检查间隔（毫秒，可选） */
  healthCheckInterval?: number;
}

// ============ Pod 相关类型 ============

export type PodStatus = 'pending' | 'running' | 'idle' | 'terminating' | 'failed';

/**
 * PluginPod 信息
 */
export interface PodInfo {
  podId: string;
  status: PodStatus;
  requestsExecuted: number;
  /** 当前正在处理的并发请求数 */
  activeRequests: number;
  createdAt: number;
  lastActiveAt: number;
  pid?: number;
}

// ============ 调用选项 ============

export interface InvokeOptions {
  timeout?: number;
  traceId?: string;
  priority?: number;
  /** 本次调用的反向回调处理函数，由 tool.route.ts 注入，经 PluginService 注册到 callbackRegistry */
  callbackHandler?: (method: string, params: unknown) => Promise<unknown>;
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
  maxPods?: number;
}

export interface GlobalMetrics {
  totalServices: number;
  totalPods: number;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
}

// ============ 销毁选项 ============

export interface DestroyOptions {
  force?: boolean;
  timeout?: number;
}

// ============ 事件类型 ============

export interface PluginServiceEvents {
  podReady: (podInfo: PodInfo) => void;
  podCreated: (podInfo: PodInfo) => void;
  podDestroyed: (podInfo: PodInfo) => void;
  podCrashed: (podInfo: PodInfo, error: Error) => void;
  requestQueued: (requestId: string) => void;
  requestCompleted: (requestId: string, duration: number) => void;
  requestFailed: (requestId: string, error: Error) => void;
  podLog: (event: { podId: string; level: 'debug' | 'error'; message: string }) => void;
}

export interface PluginServiceManagerEvents {
  serviceRegistered: (event: { serviceName: string }) => void;
  serviceUnregistered: (event: { serviceName: string }) => void;
  serviceUnhealthy: (event: { serviceName: string; reason: string }) => void;
  quotaExceeded: (event: { requested: number; available: number }) => void;
  healthCheck: (event: { timestamp: number; services: string[] }) => void;
}
