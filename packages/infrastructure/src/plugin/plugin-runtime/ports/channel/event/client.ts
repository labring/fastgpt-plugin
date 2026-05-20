import z from 'zod';

import type { InvokeMethodType } from '@domain/ports/invoke.port';

import type { PluginChannelStreamDescriptor } from '../message';

import type { PluginChannelNotificationSpec, PluginChannelRpcSpec } from './common';

/**
 * client -> host 的事件集合。
 *
 * client 是插件运行侧，host 是插件宿主侧。这里的 method 只能由 client 发送，
 * host 只能在 handler 中接收。
 */
export const PluginChannelClientMethod = {
  /**
   * 插件 runtime 初始化完成，host 收到后可以把 pod 标记为 ready。
   */
  ready: 'client.ready',
  /**
   * 插件 runtime 的 stdout/stderr 输出。
   */
  stdio: 'client.stdio',
  /**
   * 插件 runtime 主动报告启动失败、运行失败或崩溃信息。
   */
  fail: 'client.fail',
  /**
   * 插件反向调用 host 能力，例如 uploadFile、userInfo。
   */
  request: 'client.request'
} as const;

export const PluginChannelClientMethodSchema = z.enum([
  PluginChannelClientMethod.ready,
  PluginChannelClientMethod.stdio,
  PluginChannelClientMethod.fail,
  PluginChannelClientMethod.request
]);
export type PluginChannelClientMethodType = z.infer<typeof PluginChannelClientMethodSchema>;

export const PluginChannelReadyParamsSchema = z.object({
  pid: z.number().optional(),
  version: z.string().optional(),
  runtimeMode: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  startedAt: z.number().optional(),
  meta: z.unknown().optional()
});
export type PluginChannelReadyParams = z.infer<typeof PluginChannelReadyParamsSchema>;

export const PluginChannelStdioParamsSchema = z.object({
  stream: z.enum(['stdout', 'stderr']),
  chunk: z.string(),
  timestamp: z.number().optional()
});
export type PluginChannelStdioParams = z.infer<typeof PluginChannelStdioParamsSchema>;

export const PluginChannelFailParamsSchema = z.object({
  reason: z.enum(['startup', 'runtime', 'crash', 'shutdown', 'unknown']),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      data: z.unknown().optional()
    })
    .optional(),
  exitCode: z.number().nullable().optional(),
  signal: z.string().nullable().optional(),
  timestamp: z.number().optional()
});
export type PluginChannelFailParams = z.infer<typeof PluginChannelFailParamsSchema>;

export interface PluginChannelClientRequestParams<TArgs = unknown> {
  /**
   * host 暴露给插件 runtime 的方法名。
   */
  method: InvokeMethodType | (string & {});
  /**
   * 调用参数。
   */
  args: TArgs;
  /**
   * 输入流描述。真实流数据通过 channel.stream frame 传输。
   */
  input?: PluginChannelStreamDescriptor;
}

export interface PluginChannelClientToHostNotifications {
  [PluginChannelClientMethod.ready]: PluginChannelNotificationSpec<PluginChannelReadyParams>;
  [PluginChannelClientMethod.stdio]: PluginChannelNotificationSpec<PluginChannelStdioParams>;
  [PluginChannelClientMethod.fail]: PluginChannelNotificationSpec<PluginChannelFailParams>;
}

export interface PluginChannelClientToHostRequests {
  [PluginChannelClientMethod.request]: PluginChannelRpcSpec<
    PluginChannelClientRequestParams,
    unknown,
    unknown,
    unknown
  >;
}
