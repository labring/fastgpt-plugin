import z from 'zod';

import type { StreamData } from '@domain/value-objects/stream.vo';

/**
 * Channel 协议只描述可跨传输层传递的 JSON 数据。
 *
 * 它刻意不绑定 Node IPC、TCP、HTTP 等具体实现；不同 driver 只需要负责把这些
 * message 发给对端，并把收到的 message 重新交给 channel port 分发。
 */
export const PluginChannelProtocolVersionSchema = z.literal('1.0');
export type PluginChannelProtocolVersion = z.infer<typeof PluginChannelProtocolVersionSchema>;

export const PluginChannelMessageIdSchema = z.union([z.string(), z.number()]);
export type PluginChannelMessageId = z.infer<typeof PluginChannelMessageIdSchema>;

export const PluginChannelErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.unknown().optional()
});
export type PluginChannelError = z.infer<typeof PluginChannelErrorSchema>;

export const PluginChannelErrorCode = {
  parseError: 'PARSE_ERROR',
  invalidMessage: 'INVALID_MESSAGE',
  methodNotFound: 'METHOD_NOT_FOUND',
  invalidParams: 'INVALID_PARAMS',
  internalError: 'INTERNAL_ERROR',
  requestTimeout: 'REQUEST_TIMEOUT',
  channelClosed: 'CHANNEL_CLOSED',
  streamError: 'STREAM_ERROR'
} as const;

/**
 * request message：需要对端返回 success/error。
 *
 * `method` 的合法集合由 `event/` 里的方向化类型控制；这里保持 string 是为了让
 * 底层协议可以承载未来扩展的 method。
 */
export const PluginChannelRequestMessageSchema = z.object({
  protocol: PluginChannelProtocolVersionSchema,
  id: PluginChannelMessageIdSchema,
  method: z.string(),
  params: z.unknown().optional(),
  traceId: z.string().optional(),
  timestamp: z.number().optional()
});
export type PluginChannelRequestMessage = z.infer<typeof PluginChannelRequestMessageSchema>;

/**
 * notification message：单向事件，不产生响应。
 *
 * ready、stdio、fail 和 stream frame 都属于 notification。
 */
export const PluginChannelNotificationMessageSchema = PluginChannelRequestMessageSchema.omit({
  id: true
});
export type PluginChannelNotificationMessage = z.infer<
  typeof PluginChannelNotificationMessageSchema
>;

/**
 * success message：request 的成功响应。
 *
 * 流式输出不会直接塞进 `result`，而是先返回一个 stream descriptor/envelope，
 * 再通过 `channel.stream` notification 发送 chunk。
 */
export const PluginChannelSuccessMessageSchema = z.object({
  protocol: PluginChannelProtocolVersionSchema,
  id: PluginChannelMessageIdSchema,
  result: z.unknown().optional(),
  traceId: z.string().optional(),
  timestamp: z.number().optional()
});
export type PluginChannelSuccessMessage = z.infer<typeof PluginChannelSuccessMessageSchema>;

/**
 * error message：request 的失败响应。
 */
export const PluginChannelErrorMessageSchema = z.object({
  protocol: PluginChannelProtocolVersionSchema,
  id: PluginChannelMessageIdSchema,
  error: PluginChannelErrorSchema,
  traceId: z.string().optional(),
  timestamp: z.number().optional()
});
export type PluginChannelErrorMessage = z.infer<typeof PluginChannelErrorMessageSchema>;

export const PluginChannelMessageSchema = z.union([
  PluginChannelRequestMessageSchema,
  PluginChannelNotificationMessageSchema,
  PluginChannelSuccessMessageSchema,
  PluginChannelErrorMessageSchema
]);
export type PluginChannelMessage = z.infer<typeof PluginChannelMessageSchema>;

export const PluginChannelTransportSchema = z.enum(['ipc', 'tcp', 'http']);
export type PluginChannelTransport = z.infer<typeof PluginChannelTransportSchema> | (string & {});

/**
 * host：插件宿主侧，例如 local-pool 的主进程。
 * client：插件运行侧，例如 fork 出来的插件子进程或 debug runtime。
 */
export const PluginChannelSideSchema = z.enum(['host', 'client']);
export type PluginChannelSide = z.infer<typeof PluginChannelSideSchema>;

export const PluginChannelMessageKind = {
  request: 'request',
  notification: 'notification',
  success: 'success',
  error: 'error'
} as const;

export const PluginChannelStreamDescriptorSchema = z.object({
  streamId: z.string(),
  streamName: z.string(),
  meta: z.unknown().optional()
});
export type PluginChannelStreamDescriptor = z.infer<typeof PluginChannelStreamDescriptorSchema>;

/**
 * 流数据统一通过 notification 发送 frame。
 *
 * 一个 stream 生命周期为 start -> chunk* -> end/error。chunk 的 payload 保持
 * unknown，由具体事件类型决定真实数据结构。
 */
export const PluginChannelStreamFrameSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('start'),
    streamId: z.string(),
    streamName: z.string(),
    meta: z.unknown().optional()
  }),
  z.object({
    type: z.literal('chunk'),
    streamId: z.string(),
    chunk: z.unknown()
  }),
  z.object({
    type: z.literal('end'),
    streamId: z.string()
  }),
  z.object({
    type: z.literal('error'),
    streamId: z.string(),
    error: PluginChannelErrorSchema
  })
]);
export type PluginChannelStreamFrame = z.infer<typeof PluginChannelStreamFrameSchema>;

/**
 * 可以作为输出流的数据源。
 *
 * StreamData 是项目内部已有流类型；AsyncIterable 方便 adapter 或业务代码直接
 * 以异步迭代器形式接入。
 */
export type PluginChannelStreamSource<T = unknown> = StreamData<T> | AsyncIterable<T>;

/**
 * 对端发来的可读流。
 *
 * `streamName` 是稳定的业务名，`streamId` 是一次具体传输的唯一 ID。
 */
export interface PluginChannelIncomingStream<T = unknown> extends PluginChannelStreamDescriptor {
  stream: StreamData<T>;
  traceId?: string;
}

/**
 * 发给对端的可写流。
 */
export interface PluginChannelWritableStream<T = unknown> extends PluginChannelStreamDescriptor {
  write(chunk: T): Promise<void>;
  end(): Promise<void>;
  fail(error: PluginChannelError | Error | string): Promise<void>;
}

/**
 * 创建流时的可选配置。
 *
 * 通常调用方只需要传 `traceId` 或 `meta`；`streamId` 和 `streamName` 主要给底层
 * request input/output 绑定时使用。
 */
export interface PluginChannelStreamOptions {
  streamId?: string;
  streamName?: string;
  traceId?: string;
  meta?: unknown;
}
