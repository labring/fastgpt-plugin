import type { InvokePort } from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';

import type { PluginChannelIncomingStream } from '../../../ports/channel';
import type { InvokeOptions } from '../types';

export type PodStatus = 'pending' | 'running' | 'idle' | 'terminating' | 'failed';

export interface PodInfo {
  podId: string;
  status: PodStatus;
  requestsExecuted: number;
  activeRequests: number;
  createdAt: number;
  lastActiveAt: number;
  pid?: number;
}

export interface PluginPodCallbacks {
  onReady?: (info: PodInfo) => void;
  onRequestCompleted?: (payload: { requestId: string; duration: number }) => void;
  onTimeout?: (payload: { requestId: string; method: PluginInvokeEventNameType }) => void;
  onError?: (error: Error) => void;
  onExit?: (payload: { code: number | null; signal: string | null; wasRunning: boolean }) => void;
  onStdout?: (line: string) => void;
  onStderr?: (line: string) => void;
}

export interface PluginPodOptions {
  pluginPath: string;
  podTimeout: number;
  maxRequests: number;
  /** 最大并发请求数（默认 1，I/O 密集型工具可调高） */
  maxConcurrentRequests: number;
  /** 插件声明的宿主调用权限 */
  pluginPermissions: PluginPermissionEnumType[];
  callbacks?: PluginPodCallbacks;
  getInvokeSession: (invocationId?: string) => InvokePort | undefined;
}

export interface PluginPodInvokeInput<P, S extends boolean> {
  eventName: PluginInvokeEventNameType;
  payload: P;
  returnStream: S;
  options?: InvokeOptions;
}

export interface PluginPodClientRequestContext {
  requestId: string;
  method: string;
  args: unknown;
  traceId?: string;
  permissions: PluginPermissionEnumType[];
  waitForInputStream: <T = unknown>(options?: {
    timeoutMs?: number;
  }) => Promise<PluginChannelIncomingStream<T>>;
}
