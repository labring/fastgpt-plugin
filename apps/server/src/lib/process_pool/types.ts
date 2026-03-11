// ============ 配置类型 ============

/**
 * Service 级别配置（单个插件）
 */
export interface ServiceConfig {
  /** 最小 Pod 数量 */
  minPods: number;
  /** 最大 Pod 数量 */
  maxPods: number;
  /** Pod 空闲超时时间（毫秒） */
  idleTimeout: number;
  /** Pod 执行超时时间（毫秒） */
  podTimeout: number;
  /** 单个 Pod 最大请求数（防止内存泄漏） */
  maxRequestsPerPod: number;
  /** 最大队列长度 */
  maxQueueSize: number;
  /** 队列等待超时时间（毫秒，可选） */
  queueTimeout?: number;
}

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

export type PodStatus = 'pending' | 'running' | 'busy' | 'idle' | 'terminating' | 'failed';

/**
 * PluginPod 信息
 */
export interface PodInfo {
  podId: string;
  status: PodStatus;
  requestsExecuted: number;
  createdAt: number;
  lastActiveAt: number;
  pid?: number;
}

// ============ 调用选项 ============

export interface InvokeOptions {
  timeout?: number;
  traceId?: string;
  priority?: number;
}

// ============ 监控指标类型 ============

export interface PodStats {
  total: number;
  running: number;
  busy: number;
  idle: number;
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
}

export interface PluginServiceManagerEvents {
  serviceRegistered: (event: { serviceName: string }) => void;
  serviceUnregistered: (event: { serviceName: string }) => void;
  serviceUnhealthy: (event: { serviceName: string; reason: string }) => void;
  quotaExceeded: (event: { requested: number; available: number }) => void;
  healthCheck: (event: { timestamp: number; services: string[] }) => void;
}

