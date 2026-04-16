import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { StreamData } from '@domain/value-objects/stream.vo';
import type {
  PendingEntry,
  PluginIOMessage,
  PluginMessageErrorType
} from '@infrastructure/plugin/plugin-runtime/ports/plugin-io.port';

export interface PluginIpcChannelOptions {
  defaultTimeoutMs?: number;
}

export type PluginIpcRequestHandler = (message: PluginIOMessage) => Promise<unknown>;
export type PluginIpcEventHandler = (message: PluginIOMessage) => Promise<void> | void;
export type PluginIpcStreamSource<T = unknown> = StreamData<T> | AsyncIterable<T>;
export type PluginIpcStreamHandler<T = unknown> = (
  stream: PluginIpcIncomingStream<T>
) => Promise<void> | void;

export interface PluginIpcIncomingStream<T = unknown> {
  streamId: string;
  streamName: string;
  stream: StreamData<T>;
  traceId?: string;
  meta?: unknown;
}

export const HOST_INVOKE_METHOD = '__host_invoke__';

export interface PluginIpcWritableStream<T = unknown> {
  streamId: string;
  write(chunk: T): Promise<void>;
  end(): Promise<void>;
  fail(
    error:
      | PluginMessageErrorType
      | Error
      | (Partial<PluginMessageErrorType> & { message: string })
      | string
  ): Promise<void>;
}

export interface PluginIpcDuplexRequestOptions<TInput = unknown> {
  timeoutMs?: number;
  traceId?: string;
  requestId?: string;
  input?: PluginIpcStreamSource<TInput>;
  inputStreamId?: string;
  inputMeta?: unknown;
}

export interface PluginIpcDuplexResponse<TResult = unknown, TOutput = unknown> {
  requestId: string;
  result: TResult;
  output?: PluginIpcIncomingStream<TOutput>;
  inputDone?: Promise<void>;
}

export interface PluginIpcDuplexReplyOptions<TOutput = unknown> {
  output?: PluginIpcStreamSource<TOutput>;
  traceId?: string;
  outputStreamId?: string;
  outputMeta?: unknown;
}

type PluginIpcStreamFrame =
  | {
      type: 'start';
      streamId: string;
      streamName: string;
      meta?: unknown;
    }
  | {
      type: 'chunk';
      streamId: string;
      chunk: unknown;
    }
  | {
      type: 'end';
      streamId: string;
    }
  | {
      type: 'error';
      streamId: string;
      error: PluginMessageErrorType;
    };

type PendingStreamWaiter = {
  resolve: (stream: PluginIpcIncomingStream<unknown>) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

type PluginIpcEndpoint = ChildProcess | typeof process;

const IPC_STREAM_EVENT_METHOD = '__plugin_ipc_stream__';
const IPC_REQUEST_INPUT_STREAM_PREFIX = '__plugin_ipc_request_input_stream__';
const IPC_REQUEST_OUTPUT_STREAM_PREFIX = '__plugin_ipc_request_output_stream__';
const IPC_DUPLEX_REPLY_MARK = '__pluginIpcDuplexReply__';

type PluginIpcDuplexReplyEnvelope<TResult = unknown> = {
  [IPC_DUPLEX_REPLY_MARK]: true;
  hasOutputStream: boolean;
  result?: TResult;
};

type PluginIpcDuplexReplyDescriptor<TResult = unknown, TOutput = unknown> = {
  [IPC_DUPLEX_REPLY_MARK]: true;
  result?: TResult;
  output?: PluginIpcStreamSource<TOutput>;
  options?: {
    traceId?: string;
    outputStreamId?: string;
    outputMeta?: unknown;
  };
};

/**
 * IPC 低层通信通道。
 *
 * 这个类只负责一件事：把 `process.send/process.on('message')`
 * 封装成一套可复用的消息协议，供 host / client 两侧共用。
 *
 * 设计原则：
 * 1. 普通 RPC 仍然使用 `request/reply`
 * 2. 流不是透传 Node.js `Readable` 实例，而是拆成 `start/chunk/end/error` 帧
 * 3. duplex 请求的输入流和输出流都基于 requestId 派生固定 streamName，
 *    调用方不需要自己生成 streamName，因此不会和并发请求冲突
 *
 * 常见用法：
 *
 * 1. 普通请求
 * ```ts
 * const result = await channel.request('ping', { value: 1 });
 * ```
 *
 * 2. 带输入流的请求
 * ```ts
 * const input = StreamData.create<string>();
 * const response = await channel.requestDuplex('run', { mode: 'stream' }, { input });
 * await response.inputDone;
 * ```
 *
 * 3. 带输出流的请求
 * ```ts
 * const response = await channel.requestDuplex<{ prompt: string }, void, never, string>('run', {
 *   prompt: 'hello'
 * });
 *
 * response.output?.stream.onData((chunk) => console.log(chunk));
 * ```
 *
 * 4. request handler 里同时读取输入流并返回输出流
 * ```ts
 * const channel = createCurrentProcessIpcChannel();
 *
 * channel.setRequestHandler(async (message) => {
 *   const input = await channel.waitForRequestInputStream<string>(message);
 *   const output = StreamData.create<string>();
 *
 *   void input.stream.consume(async (chunk) => {
 *     output.write(String(chunk).toUpperCase());
 *   }).finally(() => {
 *     output.end();
 *   });
 *
 *   return channel.replyDuplex(message, { accepted: true }, { output });
 * });
 * ```
 */
export class PluginIpcChannel {
  private readonly pending = new Map<string, PendingEntry>();
  private readonly readyHandlers = new Set<(message: PluginIOMessage) => void>();
  private readonly errorHandlers = new Set<(error: Error) => void>();
  private readonly streamHandlers = new Map<string, Set<PluginIpcStreamHandler<unknown>>>();
  private readonly incomingStreams = new Map<string, PluginIpcIncomingStream<unknown>>();
  private readonly bufferedIncomingStreams = new Map<string, PluginIpcIncomingStream<unknown>[]>();
  private readonly pendingStreamWaiters = new Map<string, PendingStreamWaiter[]>();
  private requestHandler: PluginIpcRequestHandler | null = null;
  private eventHandler: PluginIpcEventHandler | null = null;
  private readonly endpoint: PluginIpcEndpoint;
  private readonly options: PluginIpcChannelOptions;
  private readonly unsubscribeMessage: () => void;
  private closed = false;

  constructor(endpoint: PluginIpcEndpoint, options?: PluginIpcChannelOptions);
  constructor(options?: PluginIpcChannelOptions);
  constructor(
    endpointOrOptions?: PluginIpcEndpoint | PluginIpcChannelOptions,
    maybeOptions: PluginIpcChannelOptions = {}
  ) {
    if (isPluginIpcEndpoint(endpointOrOptions)) {
      this.endpoint = endpointOrOptions;
      this.options = maybeOptions;
    } else {
      this.endpoint = process;
      this.options = endpointOrOptions ?? {};
    }

    this.unsubscribeMessage = subscribeToIpcMessages(this.endpoint, (message) => {
      void this.dispatch(message).catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  onReady(handler: (message: PluginIOMessage) => void): () => void {
    this.readyHandlers.add(handler);
    return () => {
      this.readyHandlers.delete(handler);
    };
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  setRequestHandler(handler: PluginIpcRequestHandler | null): void {
    this.requestHandler = handler;
  }

  setEventHandler(handler: PluginIpcEventHandler | null): void {
    this.eventHandler = handler;
  }

  /**
   * 发起一个 duplex 请求。
   *
   * - `params` 仍然走普通 request payload
   * - `options.input` 会被自动编码成输入流发送给对端
   * - 如果对端通过 `replyDuplex()` 返回输出流，这里会自动拿到 `output`
   *
   * 返回值里：
   * - `result` 是普通响应体
   * - `output` 是对端返回的输出流（如果有）
   * - `inputDone` 表示输入流是否已经完整发送结束
   */
  async requestDuplex<TParams, TResult, TInput = unknown, TOutput = unknown>(
    method: string,
    params: TParams,
    options?: PluginIpcDuplexRequestOptions<TInput>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>> {
    this.ensureOpen();

    const requestId = options?.requestId ?? randomUUID();
    const timeoutMs = options?.timeoutMs ?? this.options.defaultTimeoutMs ?? 30_000;
    const startedAt = Date.now();

    const inputDone =
      options?.input !== undefined
        ? this.pipeStream<TInput>(getRequestInputStreamName(requestId), options.input, {
            traceId: options.traceId,
            streamId: options.inputStreamId,
            meta: options.inputMeta
          })
        : undefined;

    if (inputDone) {
      void inputDone.catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    }

    const response = await this.request<TParams, TResult | PluginIpcDuplexReplyEnvelope<TResult>>(
      method,
      params,
      {
        timeoutMs,
        traceId: options?.traceId,
        requestId
      }
    );

    if (!isPluginIpcDuplexReplyEnvelope<TResult>(response)) {
      return {
        requestId,
        result: response as TResult,
        ...(inputDone !== undefined ? { inputDone } : {})
      };
    }

    let output: PluginIpcIncomingStream<TOutput> | undefined;
    if (response.hasOutputStream) {
      const elapsed = Date.now() - startedAt;
      const remainingTimeoutMs = Math.max(1, timeoutMs - elapsed);
      output = await this.waitForStream<TOutput>(getRequestOutputStreamName(requestId), {
        timeoutMs: remainingTimeoutMs
      });
    }

    return {
      requestId,
      result: response.result as TResult,
      ...(output !== undefined ? { output } : {}),
      ...(inputDone !== undefined ? { inputDone } : {})
    };
  }

  /**
   * 在 request handler 中构造 duplex 响应描述对象。
   *
   * `result` 是普通响应体；
   * `options.output` 是返回给请求方的输出流。
   */
  replyDuplex<TResult = unknown, TOutput = unknown>(
    _message: PluginIOMessage,
    result?: TResult,
    options?: PluginIpcDuplexReplyOptions<TOutput>
  ): PluginIpcDuplexReplyDescriptor<TResult, TOutput> {
    return {
      [IPC_DUPLEX_REPLY_MARK]: true,
      ...(result !== undefined ? { result } : {}),
      ...(options?.output !== undefined ? { output: options.output } : {}),
      ...(options !== undefined
        ? {
            options: {
              ...(options.traceId !== undefined ? { traceId: options.traceId } : {}),
              ...(options.outputStreamId !== undefined
                ? { outputStreamId: options.outputStreamId }
                : {}),
              ...(options.outputMeta !== undefined ? { outputMeta: options.outputMeta } : {})
            }
          }
        : {})
    };
  }

  /**
   * 在 request handler 中等待本次请求的输入流。
   *
   * 输入流名由 requestId 自动派生，不需要外部传 `streamName`。
   */
  async waitForRequestInputStream<T = unknown>(
    message: PluginIOMessage,
    options?: { timeoutMs?: number }
  ): Promise<PluginIpcIncomingStream<T>> {
    return this.waitForStream<T>(getRequestInputStreamName(message.id), options);
  }

  /**
   * 监听指定名字的流。
   *
   * 适合广播式或长期监听场景；如果只是“一次请求对应一条流”，
   * 优先用 `requestDuplex()` / `waitForRequestInputStream()`。
   */
  onStream<T = unknown>(streamName: string, handler: PluginIpcStreamHandler<T>): () => void {
    if (!this.streamHandlers.has(streamName)) {
      this.streamHandlers.set(streamName, new Set());
    }

    const handlers = this.streamHandlers.get(streamName)!;
    const typedHandler = handler as PluginIpcStreamHandler<unknown>;
    handlers.add(typedHandler);

    return () => {
      handlers.delete(typedHandler);
      if (handlers.size === 0) {
        this.streamHandlers.delete(streamName);
      }
    };
  }

  /**
   * 等待一条指定名字的流到达，并在本地重建成 `StreamData`。
   *
   * 这是通用底层能力；大部分“请求携带流”的场景不需要直接调它。
   */
  async waitForStream<T = unknown>(
    streamName: string,
    options?: { timeoutMs?: number }
  ): Promise<PluginIpcIncomingStream<T>> {
    this.ensureOpen();

    const buffered = this.bufferedIncomingStreams.get(streamName);
    if (buffered && buffered.length > 0) {
      const stream = buffered.shift()!;
      if (buffered.length === 0) {
        this.bufferedIncomingStreams.delete(streamName);
      }
      return stream as PluginIpcIncomingStream<T>;
    }

    return new Promise<PluginIpcIncomingStream<T>>((resolve, reject) => {
      const waiter: PendingStreamWaiter = {
        resolve: resolve as (stream: PluginIpcIncomingStream<unknown>) => void,
        reject
      };

      if (options?.timeoutMs !== undefined) {
        waiter.timer = setTimeout(() => {
          const waiters = this.pendingStreamWaiters.get(streamName);
          if (!waiters) {
            return;
          }

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
   * 创建一条发送到对端的可写流。
   *
   * 调用方需要自己保证 `streamName` 的语义和唯一性。
   * 对于 duplex 请求，通常不需要直接调它。
   */
  async createWritableStream<T = unknown>(
    streamName: string,
    options?: { traceId?: string; streamId?: string; meta?: unknown }
  ): Promise<PluginIpcWritableStream<T>> {
    this.ensureOpen();

    const streamId = options?.streamId ?? randomUUID();
    let closed = false;

    await this.sendStreamFrame(
      {
        type: 'start',
        streamId,
        streamName,
        ...(options?.meta !== undefined ? { meta: options.meta } : {})
      },
      options?.traceId
    );

    return {
      streamId,
      write: async (chunk: T) => {
        if (closed) {
          throw new Error(`Stream is already closed: ${streamId}`);
        }

        await this.sendStreamFrame(
          {
            type: 'chunk',
            streamId,
            chunk
          },
          options?.traceId
        );
      },
      end: async () => {
        if (closed) {
          return;
        }

        closed = true;
        await this.sendStreamFrame(
          {
            type: 'end',
            streamId
          },
          options?.traceId
        );
      },
      fail: async (error) => {
        if (closed) {
          return;
        }

        closed = true;
        await this.sendStreamFrame(
          {
            type: 'error',
            streamId,
            error: normalizePluginMessageError(error)
          },
          options?.traceId
        );
      }
    };
  }

  /**
   * 直接把一个本地流泵到对端。
   */
  async pipeStream<T = unknown>(
    streamName: string,
    source: PluginIpcStreamSource<T>,
    options?: { traceId?: string; streamId?: string; meta?: unknown }
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

  /**
   * 发送普通 RPC 请求并等待单次响应。
   */
  async request<TParams, TResult>(
    method: string,
    params: TParams,
    options?: { timeoutMs?: number; traceId?: string; requestId?: string }
  ): Promise<TResult> {
    this.ensureOpen();

    const id = options?.requestId ?? randomUUID();
    const timeoutMs = options?.timeoutMs ?? this.options.defaultTimeoutMs ?? 30_000;

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          Object.assign(new Error(`Request timeout: ${method}`), {
            code: 'REQUEST_TIMEOUT',
            requestId: id,
            method
          })
        );
      }, timeoutMs);

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer
      });

      this.send({
        id,
        messageType: 'request',
        method,
        params,
        ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
        timestamp: Date.now()
      }).catch((error) => {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  /** 发送单向事件，不等待响应。 */
  async emit<TData>(event: string, data: TData, traceId?: string): Promise<void> {
    this.ensureOpen();

    await this.send({
      id: randomUUID(),
      messageType: 'event',
      method: event,
      params: data,
      ...(traceId !== undefined ? { traceId } : {}),
      timestamp: Date.now()
    });
  }

  /** 向对端发送 ready 信号，通常用于子进程初始化完成后的握手。 */
  async sendReady(): Promise<void> {
    this.ensureOpen();

    await this.send({
      id: randomUUID(),
      messageType: 'ready',
      timestamp: Date.now()
    });
  }

  /** 对收到的 request 回一个成功响应。 */
  async reply(message: PluginIOMessage, result: unknown): Promise<void> {
    this.ensureOpen();

    await this.send({
      id: message.id,
      messageType: 'response',
      ...(result !== undefined ? { result } : {}),
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
  }

  /** 对收到的 request 回一个错误响应。 */
  async replyError(
    message: PluginIOMessage,
    error:
      | PluginMessageErrorType
      | Error
      | (Partial<PluginMessageErrorType> & { message: string })
      | string
  ): Promise<void> {
    this.ensureOpen();

    const normalized = normalizePluginMessageError(error);

    await this.send({
      id: message.id,
      messageType: 'error',
      error: normalized,
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
  }

  async close(reason: Error = new Error('IPC channel closed')): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.unsubscribeMessage();
    this.rejectAllPending(reason);
    this.rejectAllPendingStreamWaiters(reason);
    this.failAllIncomingStreams(reason);
  }

  private async dispatch(message: PluginIOMessage): Promise<void> {
    if (this.closed) {
      return;
    }

    if (message.messageType === 'response' || message.messageType === 'error') {
      this.handleResponse(message);
      return;
    }

    if (message.messageType === 'ready') {
      this.readyHandlers.forEach((handler) => handler(message));
      return;
    }

    if (message.messageType === 'event') {
      if (isPluginIpcStreamEnvelope(message)) {
        await this.handleStreamFrameMessage(message);
        return;
      }
      await this.eventHandler?.(message);
      return;
    }

    if (message.messageType === 'request') {
      await this.handleRequest(message);
    }
  }

  private handleResponse(message: PluginIOMessage): void {
    const entry = this.pending.get(message.id);
    if (!entry) {
      return;
    }

    clearTimeout(entry.timer);
    this.pending.delete(message.id);

    if (message.error) {
      entry.reject(toError(message.error));
      return;
    }

    entry.resolve(message.result);
  }

  private async handleRequest(message: PluginIOMessage): Promise<void> {
    if (!message.method) {
      await this.replyError(message, {
        code: 'INVALID_REQUEST',
        message: 'Request method is required'
      });
      return;
    }

    if (!this.requestHandler) {
      await this.replyError(message, {
        code: 'METHOD_NOT_FOUND',
        message: `Method not found: ${message.method}`
      });
      return;
    }

    try {
      const result = await this.requestHandler(message);
      if (isPluginIpcDuplexReplyDescriptor(result)) {
        await this.handleDuplexReply(message, result);
        return;
      }
      await this.reply(message, result);
    } catch (error) {
      await this.replyError(message, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private rejectAllPending(reason: Error): void {
    this.pending.forEach((entry, requestId) => {
      clearTimeout(entry.timer);
      entry.reject(reason);
      this.pending.delete(requestId);
    });
  }

  private rejectAllPendingStreamWaiters(reason: Error): void {
    this.pendingStreamWaiters.forEach((waiters, streamName) => {
      waiters.forEach((waiter) => {
        if (waiter.timer) {
          clearTimeout(waiter.timer);
        }
        waiter.reject(reason);
      });
      this.pendingStreamWaiters.delete(streamName);
    });
  }

  private failAllIncomingStreams(reason: Error): void {
    this.incomingStreams.forEach((incomingStream, streamId) => {
      incomingStream.stream.fail(reason);
      this.incomingStreams.delete(streamId);
    });
    this.bufferedIncomingStreams.clear();
  }

  private async sendStreamFrame(frame: PluginIpcStreamFrame, traceId?: string): Promise<void> {
    await this.emit(IPC_STREAM_EVENT_METHOD, frame, traceId);
  }

  private async handleDuplexReply(
    message: PluginIOMessage,
    descriptor: PluginIpcDuplexReplyDescriptor<unknown, unknown>
  ): Promise<void> {
    const traceId = descriptor.options?.traceId ?? message.traceId;

    if (descriptor.output !== undefined) {
      void this.pipeStream(getRequestOutputStreamName(message.id), descriptor.output, {
        traceId,
        streamId: descriptor.options?.outputStreamId,
        meta: descriptor.options?.outputMeta
      }).catch((error) => {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      });
    }

    await this.reply(message, {
      [IPC_DUPLEX_REPLY_MARK]: true,
      hasOutputStream: descriptor.output !== undefined,
      ...(descriptor.result !== undefined ? { result: descriptor.result } : {})
    } satisfies PluginIpcDuplexReplyEnvelope<unknown>);
  }

  private async handleStreamFrameMessage(message: PluginIOMessage): Promise<void> {
    const frame = message.params as PluginIpcStreamFrame;

    switch (frame.type) {
      case 'start': {
        const incomingStream: PluginIpcIncomingStream<unknown> = {
          streamId: frame.streamId,
          streamName: frame.streamName,
          stream: StreamData.create<unknown>(),
          ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
          ...(frame.meta !== undefined ? { meta: frame.meta } : {})
        };

        this.incomingStreams.set(frame.streamId, incomingStream);
        this.dispatchIncomingStream(incomingStream);
        return;
      }
      case 'chunk': {
        const incomingStream = this.incomingStreams.get(frame.streamId);
        if (!incomingStream) {
          this.emitError(new Error(`Stream not found: ${frame.streamId}`));
          return;
        }
        incomingStream.stream.write(frame.chunk);
        return;
      }
      case 'end': {
        const incomingStream = this.incomingStreams.get(frame.streamId);
        if (!incomingStream) {
          return;
        }
        incomingStream.stream.close();
        this.incomingStreams.delete(frame.streamId);
        return;
      }
      case 'error': {
        const incomingStream = this.incomingStreams.get(frame.streamId);
        if (!incomingStream) {
          return;
        }
        incomingStream.stream.fail(toError(frame.error));
        this.incomingStreams.delete(frame.streamId);
        return;
      }
    }
  }

  private dispatchIncomingStream(stream: PluginIpcIncomingStream<unknown>): void {
    let consumedByWaiter = false;
    const waiters = this.pendingStreamWaiters.get(stream.streamName);
    if (waiters && waiters.length > 0) {
      const waiter = waiters.shift()!;
      if (waiter.timer) {
        clearTimeout(waiter.timer);
      }
      if (waiters.length === 0) {
        this.pendingStreamWaiters.delete(stream.streamName);
      }
      waiter.resolve(stream);
      consumedByWaiter = true;
    }

    const handlers = this.streamHandlers.get(stream.streamName);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        Promise.resolve(handler(stream)).catch((error) => {
          this.emitError(error instanceof Error ? error : new Error(String(error)));
        });
      });
      return;
    }

    if (!consumedByWaiter) {
      if (!this.bufferedIncomingStreams.has(stream.streamName)) {
        this.bufferedIncomingStreams.set(stream.streamName, []);
      }
      this.bufferedIncomingStreams.get(stream.streamName)!.push(stream);
    }
  }

  private emitError(error: Error): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private async send(message: PluginIOMessage): Promise<void> {
    await sendIpcMessage(this.endpoint, message);
  }

  private ensureOpen(): void {
    if (this.closed) {
      throw new Error('IPC channel closed');
    }
  }
}

/** 在 host 侧为某个 child process 创建 channel。 */
export function createChildProcessIpcChannel(
  process: ChildProcess,
  options?: PluginIpcChannelOptions
): PluginIpcChannel {
  return new PluginIpcChannel(process, options);
}

/** 在 client 侧直接基于当前进程创建 channel。 */
export function createCurrentProcessIpcChannel(
  options?: PluginIpcChannelOptions
): PluginIpcChannel {
  return new PluginIpcChannel(process, options);
}

type PluginIpcMessageListener = (message: unknown) => void;

type PluginIpcPortLike = {
  send?: (message: unknown, callback?: (error: Error | null | undefined) => void) => boolean;
  on(event: 'message', listener: PluginIpcMessageListener): unknown;
  off(event: 'message', listener: PluginIpcMessageListener): unknown;
};

function subscribeToIpcMessages(
  endpoint: PluginIpcEndpoint,
  handler: (message: PluginIOMessage) => void
): () => void {
  const port = endpoint as unknown as PluginIpcPortLike;
  const listener: PluginIpcMessageListener = (message) => {
    if (isPluginIOMessage(message)) {
      handler(message);
    }
  };

  port.on('message', listener);
  return () => port.off('message', listener);
}

function sendIpcMessage(endpoint: PluginIpcEndpoint, message: PluginIOMessage): Promise<void> {
  const port = endpoint as unknown as PluginIpcPortLike;

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

function isPluginIpcEndpoint(value: unknown): value is PluginIpcEndpoint {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'on' in value &&
      typeof value.on === 'function' &&
      'off' in value &&
      typeof value.off === 'function'
  );
}

function isPluginIOMessage(message: unknown): message is PluginIOMessage {
  return Boolean(message && typeof message === 'object' && 'messageType' in message);
}

function isPluginIpcStreamEnvelope(message: PluginIOMessage): boolean {
  return message.messageType === 'event' && message.method === IPC_STREAM_EVENT_METHOD;
}

function isPluginIpcDuplexReplyEnvelope<TResult = unknown>(
  value: unknown
): value is PluginIpcDuplexReplyEnvelope<TResult> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      IPC_DUPLEX_REPLY_MARK in value &&
      'hasOutputStream' in value
  );
}

function isPluginIpcDuplexReplyDescriptor(
  value: unknown
): value is PluginIpcDuplexReplyDescriptor<unknown, unknown> {
  return Boolean(value && typeof value === 'object' && IPC_DUPLEX_REPLY_MARK in value);
}

function normalizePluginMessageError(
  error:
    | PluginMessageErrorType
    | Error
    | (Partial<PluginMessageErrorType> & { message: string })
    | string
): PluginMessageErrorType {
  if (typeof error === 'string') {
    return {
      code: 'HANDLER_ERROR',
      message: error
    };
  }

  if (error instanceof Error) {
    return {
      code: (error as Error & { code?: string }).code ?? 'HANDLER_ERROR',
      message: error.message,
      ...(error.stack !== undefined ? { stack: error.stack } : {})
    };
  }

  return {
    code: error.code ?? 'HANDLER_ERROR',
    message: error.message,
    ...(error.stack !== undefined ? { stack: error.stack } : {})
  };
}

function toError(error: PluginMessageErrorType): Error {
  return Object.assign(new Error(error.message), {
    code: error.code,
    stack: error.stack
  });
}

function toAsyncIterable<T>(source: PluginIpcStreamSource<T>): AsyncIterable<T> {
  if (source instanceof StreamData) {
    return source.values();
  }
  return source;
}

function getRequestInputStreamName(requestId: string): string {
  return `${IPC_REQUEST_INPUT_STREAM_PREFIX}:${requestId}`;
}

function getRequestOutputStreamName(requestId: string): string {
  return `${IPC_REQUEST_OUTPUT_STREAM_PREFIX}:${requestId}`;
}
