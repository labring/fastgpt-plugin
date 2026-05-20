import type {
  PluginChannelReceiveNotificationMap,
  PluginChannelReceiveNotificationParams,
  PluginChannelReceiveRequestInput,
  PluginChannelReceiveRequestMap,
  PluginChannelReceiveRequestParams,
  PluginChannelSendNotificationMap,
  PluginChannelSendRequestMap,
  PluginChannelSideNotificationParams,
  PluginChannelSideRequestInput,
  PluginChannelSideRequestOutput,
  PluginChannelSideRequestParams,
  PluginChannelSideRequestResultData
} from './event';
import type {
  PluginChannelIncomingStream,
  PluginChannelMessageId,
  PluginChannelSide,
  PluginChannelStreamOptions,
  PluginChannelStreamSource,
  PluginChannelTransport,
  PluginChannelWritableStream
} from './message';
import type { PluginChannelNotificationMessage, PluginChannelRequestMessage } from './message';

export * from './event';
export * from './message';

/**
 * 发起 request 时的控制参数。
 *
 * `input` 用于 request 附带输入流。底层会先启动一个 stream，再发送 request；
 * 接收方通过 request context 的 `waitForInputStream()` 读取。
 */
export interface PluginChannelRequestOptions<TInput = unknown> {
  /**
   * 调用方可指定 request id；默认由 adapter 生成。
   */
  id?: PluginChannelMessageId;
  /**
   * 等待 response 的超时时间，单位毫秒。
   */
  timeoutMs?: number;
  /**
   * 透传链路追踪 ID。
   */
  traceId?: string;
  /**
   * request 输入流的数据源。
   */
  input?: PluginChannelStreamSource<TInput>;
  /**
   * request 输入流的底层 stream 配置。
   */
  inputStream?: PluginChannelStreamOptions;
}

export interface PluginChannelNotifyOptions {
  traceId?: string;
}

/**
 * request 调用结果。
 *
 * 如果对端通过 `createReply(result, { output })` 返回流，`output` 会包含可读流。
 * 如果本次 request 发送了 input，`inputDone` 表示输入流写入完成。
 */
export interface PluginChannelRequestResult<TResult = unknown, TOutput = unknown> {
  requestId: PluginChannelMessageId;
  result: TResult;
  output?: PluginChannelIncomingStream<TOutput>;
  inputDone?: Promise<void>;
}

/**
 * request handler 收到的上下文。
 */
export interface PluginChannelRequestContext<
  TSide extends PluginChannelSide,
  TMethod extends keyof PluginChannelReceiveRequestMap<TSide>
> {
  /**
   * request id，response 和 request-scoped stream 都会复用它做关联。
   */
  id: PluginChannelMessageId;
  method: TMethod;
  params: PluginChannelReceiveRequestParams<TSide, TMethod>;
  traceId?: string;
  /**
   * 原始协议 message。仅在 adapter 调试或需要读取扩展字段时使用。
   */
  raw: PluginChannelRequestMessage;
  /**
   * 读取 request 附带的输入流。
   *
   * 只有调用方传了 `request(..., { input })` 时才会返回；否则会等待到超时。
   */
  waitForInputStream(options?: {
    timeoutMs?: number;
  }): Promise<PluginChannelIncomingStream<PluginChannelReceiveRequestInput<TSide, TMethod>>>;
}

/**
 * notification handler 收到的上下文。
 */
export interface PluginChannelNotificationContext<
  TSide extends PluginChannelSide,
  TMethod extends keyof PluginChannelReceiveNotificationMap<TSide>
> {
  method: TMethod;
  params: PluginChannelReceiveNotificationParams<TSide, TMethod>;
  traceId?: string;
  /**
   * 原始协议 message。仅在 adapter 调试或需要读取扩展字段时使用。
   */
  raw: PluginChannelNotificationMessage;
}

export type PluginChannelReceivedRequestContext<TSide extends PluginChannelSide> = {
  [TMethod in keyof PluginChannelReceiveRequestMap<TSide>]: PluginChannelRequestContext<
    TSide,
    TMethod
  >;
}[keyof PluginChannelReceiveRequestMap<TSide>];

export type PluginChannelReceivedNotificationContext<TSide extends PluginChannelSide> = {
  [TMethod in keyof PluginChannelReceiveNotificationMap<TSide>]: PluginChannelNotificationContext<
    TSide,
    TMethod
  >;
}[keyof PluginChannelReceiveNotificationMap<TSide>];

export type PluginChannelHandlerResult<TResult = unknown, TOutput = unknown> =
  | TResult
  | {
      result?: TResult;
      output?: PluginChannelStreamSource<TOutput>;
      outputStream?: PluginChannelStreamOptions;
    };

export type PluginChannelRequestHandler<TSide extends PluginChannelSide> = (
  request: PluginChannelReceivedRequestContext<TSide>
) => Promise<PluginChannelHandlerResult> | PluginChannelHandlerResult;

export type PluginChannelNotificationHandler<TSide extends PluginChannelSide> = (
  notification: PluginChannelReceivedNotificationContext<TSide>
) => Promise<void> | void;

/**
 * 插件 runtime channel 的稳定端口。
 *
 * `TSide` 决定当前实例的发送/接收方向：
 * - `host`：宿主侧，只能发送 host.* request，接收 client.* request/notification。
 * - `client`：插件侧，只能发送 client.* request/notification，接收 host.* request。
 *
 * 新增 tcp/http 等传输时，应优先实现这个接口，业务层只依赖 port。
 */
export interface PluginRuntimeChannelPort<TSide extends PluginChannelSide> {
  /**
   * 当前底层传输类型，例如 ipc、tcp、http。
   */
  readonly transport: PluginChannelTransport;
  /**
   * 当前 channel 所在侧。
   */
  readonly side: TSide;

  /**
   * 向对端发起 request，并等待 success/error。
   */
  request<TMethod extends keyof PluginChannelSendRequestMap<TSide>>(
    method: TMethod,
    params: PluginChannelSideRequestParams<TSide, TMethod>,
    options?: PluginChannelRequestOptions<PluginChannelSideRequestInput<TSide, TMethod>>
  ): Promise<
    PluginChannelRequestResult<
      PluginChannelSideRequestResultData<TSide, TMethod>,
      PluginChannelSideRequestOutput<TSide, TMethod>
    >
  >;

  /**
   * 向对端发送单向 notification。
   */
  notify<TMethod extends keyof PluginChannelSendNotificationMap<TSide>>(
    method: TMethod,
    params: PluginChannelSideNotificationParams<TSide, TMethod>,
    options?: PluginChannelNotifyOptions
  ): Promise<void>;

  /**
   * 注册 request handler。传 null 可取消注册。
   */
  setRequestHandler(handler: PluginChannelRequestHandler<TSide> | null): void;
  /**
   * 注册 notification handler。传 null 可取消注册。
   */
  setNotificationHandler(handler: PluginChannelNotificationHandler<TSide> | null): void;

  /**
   * 等待对端创建指定名称的流。
   *
   * request input/output 推荐使用 `request({ input })` 和 `createReply({ output })`；
   * 这个方法主要给 adapter 或显式命名流场景使用。
   */
  waitForStream<T = unknown>(
    streamName: string,
    options?: { timeoutMs?: number }
  ): Promise<PluginChannelIncomingStream<T>>;

  /**
   * 创建一个发往对端的可写流。
   */
  createWritableStream<T = unknown>(
    streamName: string,
    options?: PluginChannelStreamOptions
  ): Promise<PluginChannelWritableStream<T>>;

  /**
   * 把 StreamData 或 AsyncIterable 写入一个发往对端的流。
   */
  pipeStream<T = unknown>(
    streamName: string,
    source: PluginChannelStreamSource<T>,
    options?: PluginChannelStreamOptions
  ): Promise<void>;

  /**
   * 在 request handler 中返回带输出流的响应。
   *
   * 用法：
   * `return channel.createReply(result, { output })`
   */
  createReply<TResult = unknown, TOutput = unknown>(
    result?: TResult,
    options?: {
      output?: PluginChannelStreamSource<TOutput>;
      outputStream?: PluginChannelStreamOptions;
    }
  ): PluginChannelHandlerResult<TResult, TOutput>;

  /**
   * 订阅 adapter 内部错误。
   */
  onError(handler: (error: Error) => void): () => void;
  /**
   * 订阅 channel 关闭事件。
   */
  onClose(handler: (reason?: Error) => void): () => void;
  /**
   * 关闭 channel，并拒绝所有 pending request / stream waiter。
   */
  close(reason?: Error): Promise<void>;
}
