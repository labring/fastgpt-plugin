import z from 'zod';

import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';

import type { PluginChannelStreamDescriptor } from '../message';

import type { PluginChannelRpcSpec } from './common';

/**
 * host -> client 的事件集合。
 *
 * host 是插件宿主侧，client 是插件运行侧。这里的 method 只能由 host 发送，
 * client 只能在 handler 中接收。
 */
export const PluginChannelHostMethod = {
  /**
   * 调用插件业务事件，例如 run。
   */
  request: 'host.request',
  /**
   * 健康检查。
   */
  ping: 'host.ping',
  /**
   * 通知插件 runtime 准备退出。
   */
  shutdown: 'host.shutdown'
} as const;

export const PluginChannelHostMethodSchema = z.enum([
  PluginChannelHostMethod.request,
  PluginChannelHostMethod.ping,
  PluginChannelHostMethod.shutdown
]);
export type PluginChannelHostMethodType = z.infer<typeof PluginChannelHostMethodSchema>;

export interface PluginChannelHostRequestParams<TPayload = unknown> {
  /**
   * 插件业务事件名。
   */
  eventName: PluginInvokeEventNameType | (string & {});
  /**
   * 插件业务参数。
   */
  payload: TPayload;
  /**
   * 输入流描述。真实流数据通过 channel.stream frame 传输。
   */
  input?: PluginChannelStreamDescriptor;
  /**
   * 标记调用方期望流式返回。具体是否返回流由 client handler 决定。
   */
  returnStream?: boolean;
}

export const PluginChannelPingParamsSchema = z.object({
  timestamp: z.number()
});
export type PluginChannelPingParams = z.infer<typeof PluginChannelPingParamsSchema>;

export const PluginChannelPingResultSchema = z.object({
  timestamp: z.number(),
  receivedAt: z.number().optional()
});
export type PluginChannelPingResult = z.infer<typeof PluginChannelPingResultSchema>;

export const PluginChannelShutdownParamsSchema = z.object({
  reason: z.string().optional(),
  timeoutMs: z.number().nonnegative().optional()
});
export type PluginChannelShutdownParams = z.infer<typeof PluginChannelShutdownParamsSchema>;

export const PluginChannelShutdownResultSchema = z.object({
  accepted: z.boolean(),
  message: z.string().optional()
});
export type PluginChannelShutdownResult = z.infer<typeof PluginChannelShutdownResultSchema>;

export interface PluginChannelHostToClientRequests {
  [PluginChannelHostMethod.request]: PluginChannelRpcSpec<
    PluginChannelHostRequestParams,
    unknown,
    unknown,
    unknown
  >;
  [PluginChannelHostMethod.ping]: PluginChannelRpcSpec<
    PluginChannelPingParams,
    PluginChannelPingResult
  >;
  [PluginChannelHostMethod.shutdown]: PluginChannelRpcSpec<
    PluginChannelShutdownParams,
    PluginChannelShutdownResult
  >;
}
