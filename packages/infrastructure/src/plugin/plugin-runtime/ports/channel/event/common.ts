import z from 'zod';

import type { PluginChannelStreamFrame } from '../message';

export const PluginChannelCommonMethod = {
  /**
   * 双向通用的流 frame 通道。
   *
   * 业务侧不直接调用这个 method；使用 `request({ input })`、`createReply({ output })`
   * 或 `pipeStream()` 时由底层 channel 自动发送。
   */
  streamFrame: 'channel.stream'
} as const;

/**
 * 一个 request method 的类型描述。
 *
 * TParams：request.params
 * TResult：普通返回值
 * TInput：request 附带输入流的 chunk 类型
 * TOutput：response 附带输出流的 chunk 类型
 */
export interface PluginChannelRpcSpec<
  TParams = unknown,
  TResult = unknown,
  TInput = unknown,
  TOutput = unknown
> {
  params: TParams;
  result: TResult;
  input: TInput;
  output: TOutput;
}

/**
 * 一个 notification method 的类型描述。
 */
export interface PluginChannelNotificationSpec<TParams = unknown> {
  params: TParams;
}

export interface PluginChannelCommonNotifications {
  [PluginChannelCommonMethod.streamFrame]: PluginChannelNotificationSpec<PluginChannelStreamFrame>;
}

export const PluginChannelCommonMethodSchema = z.enum([PluginChannelCommonMethod.streamFrame]);
export type PluginChannelCommonMethodType = z.infer<typeof PluginChannelCommonMethodSchema>;
