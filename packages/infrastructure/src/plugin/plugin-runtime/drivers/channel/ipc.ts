import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import {
  deserializeError,
  serializeError,
  type SerializedError
} from '@domain/value-objects/error.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import '@infrastructure/errors/error.registry';

import {
  PluginChannelCommonMethod,
  type PluginChannelError,
  PluginChannelErrorCode,
  type PluginChannelIncomingStream,
  type PluginChannelMessage,
  type PluginChannelMessageId,
  type PluginChannelNotificationHandler,
  type PluginChannelNotificationMessage,
  type PluginChannelReceiveNotificationMap,
  type PluginChannelReceiveRequestMap,
  type PluginChannelRequestHandler,
  type PluginChannelRequestMessage,
  type PluginChannelRequestOptions,
  type PluginChannelRequestResult,
  type PluginChannelSendNotificationMap,
  type PluginChannelSendRequestMap,
  type PluginChannelSide,
  type PluginChannelSideNotificationParams,
  type PluginChannelSideRequestInput,
  type PluginChannelSideRequestOutput,
  type PluginChannelSideRequestParams,
  type PluginChannelSideRequestResultData,
  type PluginChannelStreamFrame,
  type PluginChannelStreamOptions,
  type PluginChannelStreamSource,
  type PluginChannelWritableStream,
  type PluginRuntimeChannelPort
} from '../../ports/channel';

/**
 * Node IPC channel adapter 配置。
 */
export interface PluginIpcRuntimeChannelOptions {
  /**
   * request 默认超时时间，单位毫秒。单次调用可通过 request options 覆盖。
   */
  defaultTimeoutMs?: number;
}

type PluginIpcEndpoint = ChildProcess | typeof process;

type PendingRequest = {
  method: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type PendingStreamWaiter = {
  resolve: (stream: PluginChannelIncomingStream<unknown>) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

type IpcMessageListener = (message: unknown) => void;

type IpcPortLike = {
  send?: (message: unknown, callback?: (error: Error | null | undefined) => void) => boolean;
  on(event: 'message', listener: IpcMessageListener): unknown;
  off(event: 'message', listener: IpcMessageListener): unknown;
};

const PROTOCOL_VERSION = '1.0';
const REQUEST_INPUT_STREAM_PREFIX = 'request.input';
const REQUEST_OUTPUT_STREAM_PREFIX = 'request.output';
const CHANNEL_REPLY_MARK = '__fastgptChannelReply__';

type ChannelReplyDescriptor<TResult = unknown, TOutput = unknown> = {
  [CHANNEL_REPLY_MARK]: true;
  result?: TResult;
  output?: PluginChannelStreamSource<TOutput>;
  outputStream?: PluginChannelStreamOptions;
};

type PluginChannelResponseMessage = Extract<
  PluginChannelMessage,
  { id: PluginChannelMessageId; method?: never }
>;

/**
 * 基于 Node.js child_process IPC 的 channel 实现。
 *
 * 这个类只负责传输层：
 * - 把 port request/notify 编码成协议 message 后通过 `process.send()` 发出。
 * - 从 `message` 事件接收协议 message 并分发给 handler。
 * - 使用 `channel.stream` notification 传输流 frame。
 *
 * 业务代码通常不直接 new 这个类，而是使用
 * `createChildProcessPluginChannel()` 或 `createCurrentProcessPluginChannel()`。
 */
export class PluginIpcRuntimeChannel<TSide extends PluginChannelSide>
  implements PluginRuntimeChannelPort<TSide>
{
  readonly transport = 'ipc';
  private readonly pending = new Map<PluginChannelMessageId, PendingRequest>();
  private readonly errorHandlers = new Set<(error: Error) => void>();
  private readonly closeHandlers = new Set<(reason?: Error) => void>();
  private readonly incomingStreams = new Map<string, PluginChannelIncomingStream<unknown>>();
  private readonly bufferedIncomingStreams = new Map<
    string,
    PluginChannelIncomingStream<unknown>[]
  >();
  private readonly pendingStreamWaiters = new Map<string, PendingStreamWaiter[]>();
  private requestHandler: PluginChannelRequestHandler<TSide> | null = null;
  private notificationHandler: PluginChannelNotificationHandler<TSide> | null = null;
  private closed = false;
  private readonly unsubscribeMessage: () => void;

  constructor(
    readonly side: TSide,
    private readonly endpoint: PluginIpcEndpoint,
    private readonly options: PluginIpcRuntimeChannelOptions = {}
  ) {
    this.unsubscribeMessage = subscribeToIpcMessages(endpoint, (message) => {
      void this.dispatch(message).catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  /**
   * 发起 request。
   *
   * 如果 options.input 存在，会在发送 request 前启动 request-scoped 输入流；
   * 对端 handler 可通过 `waitForInputStream()` 读取。
   */
  async request<TMethod extends keyof PluginChannelSendRequestMap<TSide>>(
    method: TMethod,
    params: PluginChannelSideRequestParams<TSide, TMethod>,
    options?: PluginChannelRequestOptions<PluginChannelSideRequestInput<TSide, TMethod>>
  ): Promise<
    PluginChannelRequestResult<
      PluginChannelSideRequestResultData<TSide, TMethod>,
      PluginChannelSideRequestOutput<TSide, TMethod>
    >
  > {
    this.ensureOpen();

    const id = options?.id ?? randomUUID();
    const timeoutMs = options?.timeoutMs ?? this.options.defaultTimeoutMs ?? 30_000;
    const inputDone =
      options?.input !== undefined
        ? this.pipeStream(getRequestInputStreamName(id), options.input, {
            traceId: options.traceId,
            streamId: options.inputStream?.streamId,
            streamName: options.inputStream?.streamName,
            meta: options.inputStream?.meta
          })
        : undefined;
    const startedAt = Date.now();

    if (inputDone) {
      void inputDone.catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    }

    const response = await new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          Object.assign(new Error(`Request timeout: ${String(method)}`), {
            code: PluginChannelErrorCode.requestTimeout,
            requestId: id,
            method
          })
        );
      }, timeoutMs);

      this.pending.set(id, {
        method: String(method),
        resolve,
        reject,
        timer
      });

      this.send({
        protocol: PROTOCOL_VERSION,
        id,
        method: String(method),
        params,
        ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
        timestamp: Date.now()
      }).catch((error) => {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });

    let result = response as PluginChannelSideRequestResultData<TSide, TMethod>;
    let output:
      | PluginChannelIncomingStream<PluginChannelSideRequestOutput<TSide, TMethod>>
      | undefined;

    if (isChannelReplyEnvelope<PluginChannelSideRequestResultData<TSide, TMethod>>(response)) {
      result = response.result as PluginChannelSideRequestResultData<TSide, TMethod>;

      if (response.hasOutputStream) {
        const elapsed = Date.now() - startedAt;
        const remainingTimeoutMs = Math.max(1, timeoutMs - elapsed);
        output = await this.waitForStream<PluginChannelSideRequestOutput<TSide, TMethod>>(
          getRequestOutputStreamName(id),
          { timeoutMs: remainingTimeoutMs }
        );
      }
    }

    return {
      requestId: id,
      result,
      ...(output !== undefined ? { output } : {}),
      ...(inputDone !== undefined ? { inputDone } : {})
    };
  }

  /**
   * 发送单向 notification。
   */
  async notify<TMethod extends keyof PluginChannelSendNotificationMap<TSide>>(
    method: TMethod,
    params: PluginChannelSideNotificationParams<TSide, TMethod>,
    options?: { traceId?: string }
  ): Promise<void> {
    this.ensureOpen();
    await this.send({
      protocol: PROTOCOL_VERSION,
      method: String(method),
      params,
      ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
      timestamp: Date.now()
    });
  }

  /**
   * 注册对端 request 的处理函数。
   */
  setRequestHandler(handler: PluginChannelRequestHandler<TSide> | null): void {
    this.requestHandler = handler;
  }

  /**
   * 注册对端 notification 的处理函数。
   */
  setNotificationHandler(handler: PluginChannelNotificationHandler<TSide> | null): void {
    this.notificationHandler = handler;
  }

  /**
   * 等待指定名称的输入流。
   *
   * 已经提前到达的 stream 会先缓存在 bufferedIncomingStreams 里。
   */
  async waitForStream<T = unknown>(
    streamName: string,
    options?: { timeoutMs?: number }
  ): Promise<PluginChannelIncomingStream<T>> {
    this.ensureOpen();

    const buffered = this.bufferedIncomingStreams.get(streamName);
    if (buffered && buffered.length > 0) {
      const stream = buffered.shift()!;
      if (buffered.length === 0) {
        this.bufferedIncomingStreams.delete(streamName);
      }
      return stream as PluginChannelIncomingStream<T>;
    }

    return new Promise<PluginChannelIncomingStream<T>>((resolve, reject) => {
      const waiter: PendingStreamWaiter = {
        resolve: resolve as (stream: PluginChannelIncomingStream<unknown>) => void,
        reject
      };

      if (options?.timeoutMs !== undefined) {
        waiter.timer = setTimeout(() => {
          const waiters = this.pendingStreamWaiters.get(streamName);
          if (!waiters) return;

          const index = waiters.indexOf(waiter);
          if (index >= 0) {
            waiters.splice(index, 1);
          }
          if (waiters.length === 0) {
            this.pendingStreamWaiters.delete(streamName);
          }
          reject(new Error(`Wait stream timeout: ${streamName}`));
        }, options.timeoutMs);
      }

      if (!this.pendingStreamWaiters.has(streamName)) {
        this.pendingStreamWaiters.set(streamName, []);
      }
      this.pendingStreamWaiters.get(streamName)!.push(waiter);
    });
  }

  /**
   * 创建一个发往对端的可写流，并立即发送 start frame。
   */
  async createWritableStream<T = unknown>(
    streamName: string,
    options?: PluginChannelStreamOptions
  ): Promise<PluginChannelWritableStream<T>> {
    this.ensureOpen();

    const streamId = options?.streamId ?? randomUUID();
    let closed = false;
    const remoteStreamName = options?.streamName ?? streamName;

    await this.sendStreamFrame(
      {
        type: 'start',
        streamId,
        streamName: remoteStreamName,
        ...(options?.meta !== undefined ? { meta: options.meta } : {})
      },
      options?.traceId
    );

    return {
      streamId,
      streamName: remoteStreamName,
      ...(options?.meta !== undefined ? { meta: options.meta } : {}),
      write: async (chunk: T) => {
        if (closed) throw new Error(`Stream is already closed: ${streamId}`);
        await this.sendStreamFrame({ type: 'chunk', streamId, chunk }, options?.traceId);
      },
      end: async () => {
        if (closed) return;
        closed = true;
        await this.sendStreamFrame({ type: 'end', streamId }, options?.traceId);
      },
      fail: async (error) => {
        if (closed) return;
        closed = true;
        await this.sendStreamFrame(
          {
            type: 'error',
            streamId,
            error: normalizeChannelError(error)
          },
          options?.traceId
        );
      }
    };
  }

  /**
   * 把数据源写入对端流。写入完成发送 end，异常时发送 error。
   */
  async pipeStream<T = unknown>(
    streamName: string,
    source: PluginChannelStreamSource<T>,
    options?: PluginChannelStreamOptions
  ): Promise<void> {
    const writable = await this.createWritableStream<T>(streamName, options);
    try {
      for await (const chunk of toAsyncIterable(source)) {
        await writable.write(chunk);
      }
      await writable.end();
    } catch (error) {
      await writable.fail(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  onClose(handler: (reason?: Error) => void): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  async close(reason: Error = new Error('Channel closed')): Promise<void> {
    if (this.closed) return;

    this.closed = true;
    this.unsubscribeMessage();
    this.rejectAllPending(reason);
    this.rejectAllPendingStreamWaiters(reason);
    this.failAllIncomingStreams(reason);
    this.closeHandlers.forEach((handler) => handler(reason));
  }

  /**
   * 构造 request handler 的返回值。
   *
   * adapter 会先返回普通 result，再异步把 output 写成 request-scoped 输出流。
   */
  createReply<TResult = unknown, TOutput = unknown>(
    result?: TResult,
    options?: {
      output?: PluginChannelStreamSource<TOutput>;
      outputStream?: PluginChannelStreamOptions;
    }
  ): ChannelReplyDescriptor<TResult, TOutput> {
    return {
      [CHANNEL_REPLY_MARK]: true,
      ...(result !== undefined ? { result } : {}),
      ...(options?.output !== undefined ? { output: options.output } : {}),
      ...(options?.outputStream !== undefined ? { outputStream: options.outputStream } : {})
    };
  }

  private async dispatch(message: PluginChannelMessage): Promise<void> {
    if (this.closed) return;

    if (isResponseMessage(message)) {
      this.handleResponse(message);
      return;
    }

    if (isRequestMessage(message)) {
      await this.handleRequest(message);
      return;
    }

    await this.handleNotification(message);
  }

  private handleResponse(message: PluginChannelResponseMessage): void {
    const pending = this.pending.get(message.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(message.id);

    if ('error' in message) {
      pending.reject(toError(message.error));
      return;
    }

    pending.resolve(message.result);
  }

  private async handleRequest(message: PluginChannelRequestMessage): Promise<void> {
    if (!this.requestHandler) {
      await this.replyError(message, {
        code: PluginChannelErrorCode.methodNotFound,
        message: `Method not found: ${message.method}`
      });
      return;
    }

    try {
      const result = await this.requestHandler({
        id: message.id,
        method: message.method as keyof PluginChannelReceiveRequestMap<TSide>,
        params: message.params as never,
        ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
        raw: message,
        waitForInputStream: <T = unknown>(options?: { timeoutMs?: number }) =>
          this.waitForStream<T>(getRequestInputStreamName(message.id), options)
      });

      if (isChannelReplyDescriptor(result)) {
        await this.handleReplyDescriptor(message, result);
        return;
      }

      await this.reply(message, result);
    } catch (error) {
      await this.replyError(message, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleNotification(message: PluginChannelNotificationMessage): Promise<void> {
    if (message.method === PluginChannelCommonMethod.streamFrame) {
      await this.handleStreamFrame(message.params as PluginChannelStreamFrame, message.traceId);
      return;
    }

    await this.notificationHandler?.({
      method: message.method as keyof PluginChannelReceiveNotificationMap<TSide>,
      params: message.params as never,
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      raw: message
    });
  }

  private async handleReplyDescriptor(
    message: PluginChannelRequestMessage,
    descriptor: ChannelReplyDescriptor
  ): Promise<void> {
    if (descriptor.output !== undefined) {
      void this.pipeStream(getRequestOutputStreamName(message.id), descriptor.output, {
        traceId: descriptor.outputStream?.traceId ?? message.traceId,
        streamId: descriptor.outputStream?.streamId,
        streamName: descriptor.outputStream?.streamName,
        meta: descriptor.outputStream?.meta
      }).catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    }

    await this.reply(message, {
      [CHANNEL_REPLY_MARK]: true,
      hasOutputStream: descriptor.output !== undefined,
      ...(descriptor.result !== undefined ? { result: descriptor.result } : {})
    });
  }

  private async reply(message: PluginChannelRequestMessage, result: unknown): Promise<void> {
    await this.send({
      protocol: PROTOCOL_VERSION,
      id: message.id,
      ...(result !== undefined ? { result } : {}),
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
  }

  private async replyError(
    message: PluginChannelRequestMessage,
    error: PluginChannelError | Error | string
  ): Promise<void> {
    await this.send({
      protocol: PROTOCOL_VERSION,
      id: message.id,
      error: normalizeChannelError(error),
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
  }

  private async sendStreamFrame(frame: PluginChannelStreamFrame, traceId?: string): Promise<void> {
    await this.notify(PluginChannelCommonMethod.streamFrame, frame as never, { traceId });
  }

  private async handleStreamFrame(
    frame: PluginChannelStreamFrame,
    traceId?: string
  ): Promise<void> {
    switch (frame.type) {
      case 'start': {
        const incoming: PluginChannelIncomingStream<unknown> = {
          streamId: frame.streamId,
          streamName: frame.streamName,
          stream: StreamData.create<unknown>(),
          ...(traceId !== undefined ? { traceId } : {}),
          ...(frame.meta !== undefined ? { meta: frame.meta } : {})
        };
        this.incomingStreams.set(frame.streamId, incoming);
        this.dispatchIncomingStream(incoming);
        return;
      }
      case 'chunk': {
        const incoming = this.incomingStreams.get(frame.streamId);
        if (!incoming) {
          this.emitError(new Error(`Stream not found: ${frame.streamId}`));
          return;
        }
        incoming.stream.write(frame.chunk);
        return;
      }
      case 'end': {
        const incoming = this.incomingStreams.get(frame.streamId);
        if (!incoming) return;
        incoming.stream.end();
        this.incomingStreams.delete(frame.streamId);
        return;
      }
      case 'error': {
        const incoming = this.incomingStreams.get(frame.streamId);
        if (!incoming) return;
        incoming.stream.fail(toError(frame.error));
        this.incomingStreams.delete(frame.streamId);
        return;
      }
    }
  }

  private dispatchIncomingStream(stream: PluginChannelIncomingStream<unknown>): void {
    let consumedByWaiter = false;
    const waiters = this.pendingStreamWaiters.get(stream.streamName);
    if (waiters && waiters.length > 0) {
      const waiter = waiters.shift()!;
      if (waiter.timer) clearTimeout(waiter.timer);
      if (waiters.length === 0) this.pendingStreamWaiters.delete(stream.streamName);
      waiter.resolve(stream);
      consumedByWaiter = true;
    }

    if (!consumedByWaiter) {
      if (!this.bufferedIncomingStreams.has(stream.streamName)) {
        this.bufferedIncomingStreams.set(stream.streamName, []);
      }
      this.bufferedIncomingStreams.get(stream.streamName)!.push(stream);
    }
  }

  private rejectAllPending(reason: Error): void {
    this.pending.forEach((pending, id) => {
      clearTimeout(pending.timer);
      pending.reject(reason);
      this.pending.delete(id);
    });
  }

  private rejectAllPendingStreamWaiters(reason: Error): void {
    this.pendingStreamWaiters.forEach((waiters, streamName) => {
      waiters.forEach((waiter) => {
        if (waiter.timer) clearTimeout(waiter.timer);
        waiter.reject(reason);
      });
      this.pendingStreamWaiters.delete(streamName);
    });
  }

  private failAllIncomingStreams(reason: Error): void {
    this.incomingStreams.forEach((stream, id) => {
      stream.stream.fail(reason);
      this.incomingStreams.delete(id);
    });
    this.bufferedIncomingStreams.clear();
  }

  private emitError(error: Error): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private async send(message: PluginChannelMessage): Promise<void> {
    await sendIpcMessage(this.endpoint, message);
  }

  private ensureOpen(): void {
    if (this.closed) {
      throw new Error('Channel closed');
    }
  }
}

/**
 * 宿主侧创建 IPC channel。参数是 fork 出来的 child process。
 */
export function createChildProcessPluginChannel(
  process: ChildProcess,
  options?: PluginIpcRuntimeChannelOptions
): PluginIpcRuntimeChannel<'host'> {
  return new PluginIpcRuntimeChannel('host', process, options);
}

/**
 * 插件子进程侧创建 IPC channel。内部使用当前进程的 `process.send/on('message')`。
 */
export function createCurrentProcessPluginChannel(
  options?: PluginIpcRuntimeChannelOptions
): PluginIpcRuntimeChannel<'client'> {
  return new PluginIpcRuntimeChannel('client', process, options);
}

function subscribeToIpcMessages(
  endpoint: PluginIpcEndpoint,
  handler: (message: PluginChannelMessage) => void
): () => void {
  const port = endpoint as unknown as IpcPortLike;
  const listener: IpcMessageListener = (message) => {
    if (isPluginChannelMessage(message)) {
      handler(message);
    }
  };
  port.on('message', listener);
  return () => port.off('message', listener);
}

function sendIpcMessage(endpoint: PluginIpcEndpoint, message: PluginChannelMessage): Promise<void> {
  const port = endpoint as unknown as IpcPortLike;
  if (typeof port.send !== 'function') {
    throw new Error('IPC channel not available');
  }

  return new Promise((resolve, reject) => {
    port.send!(message, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function isPluginChannelMessage(value: unknown): value is PluginChannelMessage {
  return Boolean(value && typeof value === 'object' && 'protocol' in value);
}

function isRequestMessage(message: PluginChannelMessage): message is PluginChannelRequestMessage {
  return 'id' in message && 'method' in message;
}

function isResponseMessage(message: PluginChannelMessage): message is PluginChannelResponseMessage {
  return 'id' in message && !('method' in message) && ('result' in message || 'error' in message);
}

function isChannelReplyDescriptor(value: unknown): value is ChannelReplyDescriptor {
  return Boolean(
    value &&
      typeof value === 'object' &&
      CHANNEL_REPLY_MARK in value &&
      (value as Record<string, unknown>)[CHANNEL_REPLY_MARK] === true
  );
}

function isChannelReplyEnvelope<TResult = unknown>(
  value: unknown
): value is { [CHANNEL_REPLY_MARK]: true; hasOutputStream: boolean; result?: TResult } {
  return Boolean(
    value && typeof value === 'object' && CHANNEL_REPLY_MARK in value && 'hasOutputStream' in value
  );
}

function normalizeChannelError(error: PluginChannelError | Error | string): PluginChannelError {
  if (typeof error === 'string') {
    return {
      code: PluginChannelErrorCode.internalError,
      message: error
    };
  }

  if (error instanceof Error) {
    const serialized = serializeError(error);
    return toPluginChannelError(serialized);
  }

  return error;
}

function toError(error: PluginChannelError): Error {
  return deserializeError(toSerializedError(error));
}

function toPluginChannelError(error: SerializedError): PluginChannelError {
  return {
    code: error.code ?? PluginChannelErrorCode.internalError,
    message: error.message,
    ...(error.data !== undefined ? { data: error.data } : {}),
    ...(error.cause !== undefined ? { cause: toPluginChannelError(error.cause) } : {})
  };
}

function toSerializedError(error: PluginChannelError): SerializedError {
  return {
    name: 'Error',
    code: error.code,
    message: error.message,
    data: error.data,
    ...(error.cause !== undefined ? { cause: toSerializedError(error.cause) } : {})
  };
}

function toAsyncIterable<T>(source: PluginChannelStreamSource<T>): AsyncIterable<T> {
  if (source instanceof StreamData) {
    return source.values();
  }
  return source;
}

function getRequestInputStreamName(requestId: PluginChannelMessageId): string {
  return `${REQUEST_INPUT_STREAM_PREFIX}:${String(requestId)}`;
}

function getRequestOutputStreamName(requestId: PluginChannelMessageId): string {
  return `${REQUEST_OUTPUT_STREAM_PREFIX}:${String(requestId)}`;
}
