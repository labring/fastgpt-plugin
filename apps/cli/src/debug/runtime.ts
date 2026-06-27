import { randomUUID } from 'node:crypto';

import { StreamData } from '@domain/value-objects/stream.vo';
import {
  PluginChannelClientMethod,
  type PluginChannelHandlerResult,
  PluginChannelHostMethod,
  type PluginChannelIncomingStream,
  type PluginChannelNotificationHandler,
  type PluginChannelNotifyOptions,
  type PluginChannelReceivedNotificationContext,
  type PluginChannelReceivedRequestContext,
  type PluginChannelRequestHandler,
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
  type PluginChannelStreamOptions,
  type PluginChannelStreamSource,
  type PluginChannelWritableStream,
  type PluginRuntimeChannelPort
} from '@infrastructure/plugin/plugin-runtime/ports/channel';

const LOCAL_DEBUG_RUNTIME_GLOBAL_KEY = '__FASTGPT_PLUGIN_LOCAL_DEBUG_RUNTIME__';
const LOCAL_DEBUG_REPLY_MARK = '__localDebugReply__';

type LocalDebugReplyDescriptor<TResult = unknown, TOutput = unknown> = {
  [LOCAL_DEBUG_REPLY_MARK]: true;
  result?: TResult;
  output?: PluginChannelStreamSource<TOutput>;
  outputStream?: PluginChannelStreamOptions;
};

export interface LocalDebugHostRequestContext<TArgs = unknown, TInput = unknown> {
  method: string;
  args: TArgs;
  traceId?: string;
  input?: PluginChannelStreamSource<TInput>;
  createReply<TResult = unknown, TOutput = unknown>(
    result?: TResult,
    options?: {
      output?: PluginChannelStreamSource<TOutput>;
      outputStream?: PluginChannelStreamOptions;
    }
  ): LocalDebugReplyDescriptor<TResult, TOutput>;
}

export type LocalDebugHostRequestHandler = (
  request: LocalDebugHostRequestContext
) => Promise<unknown> | unknown;

class LocalDebugChannel<TSide extends PluginChannelSide>
  implements PluginRuntimeChannelPort<TSide>
{
  readonly transport = 'local-debug';
  private requestHandler: PluginChannelRequestHandler<TSide> | null = null;
  private notificationHandler: PluginChannelNotificationHandler<TSide> | null = null;
  private readonly errorHandlers = new Set<(error: Error) => void>();
  private readonly closeHandlers = new Set<(reason?: Error) => void>();

  constructor(
    readonly side: TSide,
    private readonly runtime: LocalDebugRuntime
  ) {}

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
    return this.runtime.dispatchFromSide(this.side, method, params, options);
  }

  async notify<TMethod extends keyof PluginChannelSendNotificationMap<TSide>>(
    method: TMethod,
    params: PluginChannelSideNotificationParams<TSide, TMethod>,
    options?: PluginChannelNotifyOptions
  ): Promise<void> {
    await this.runtime.notifyFromSide(this.side, method, params, options);
  }

  setRequestHandler(handler: PluginChannelRequestHandler<TSide> | null): void {
    this.requestHandler = handler;
  }

  setNotificationHandler(handler: PluginChannelNotificationHandler<TSide> | null): void {
    this.notificationHandler = handler;
  }

  async waitForStream<T = unknown>(): Promise<PluginChannelIncomingStream<T>> {
    throw new Error('Local debug channel does not support detached stream waiters.');
  }

  async createWritableStream<T = unknown>(
    streamName: string,
    options?: PluginChannelStreamOptions
  ): Promise<PluginChannelWritableStream<T>> {
    const stream = StreamData.create<T>();
    return {
      streamId: options?.streamId ?? randomUUID(),
      streamName: options?.streamName ?? streamName,
      ...(options?.meta !== undefined ? { meta: options.meta } : {}),
      write: async (chunk) => stream.write(chunk),
      end: async () => stream.end(),
      fail: async (error) => stream.fail(error instanceof Error ? error : new Error(String(error)))
    };
  }

  async pipeStream(): Promise<void> {
    throw new Error('Local debug channel does not support detached stream piping.');
  }

  createReply<TResult = unknown, TOutput = unknown>(
    result?: TResult,
    options?: {
      output?: PluginChannelStreamSource<TOutput>;
      outputStream?: PluginChannelStreamOptions;
    }
  ): PluginChannelHandlerResult<TResult, TOutput> {
    return {
      [LOCAL_DEBUG_REPLY_MARK]: true,
      ...(result !== undefined ? { result } : {}),
      ...(options?.output !== undefined ? { output: options.output } : {}),
      ...(options?.outputStream !== undefined ? { outputStream: options.outputStream } : {})
    } as PluginChannelHandlerResult<TResult, TOutput>;
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

  async close(reason?: Error): Promise<void> {
    this.closeHandlers.forEach((handler) => handler(reason));
  }

  async handleRequest(
    request: PluginChannelReceivedRequestContext<TSide>
  ): Promise<PluginChannelHandlerResult> {
    if (!this.requestHandler) {
      throw new Error(`Local debug request handler is not configured: ${String(request.method)}`);
    }
    return this.requestHandler(request);
  }

  async handleNotification(
    notification: PluginChannelReceivedNotificationContext<TSide>
  ): Promise<void> {
    await this.notificationHandler?.(notification);
  }
}

export class LocalDebugRuntime {
  private hostRequestHandler: LocalDebugHostRequestHandler | null = null;
  private ready = false;
  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  readonly hostChannel: LocalDebugChannel<'host'>;
  readonly pluginChannel: LocalDebugChannel<'client'>;

  constructor() {
    this.hostChannel = new LocalDebugChannel('host', this);
    this.pluginChannel = new LocalDebugChannel('client', this);
    this.hostChannel.setNotificationHandler(async (notification) => {
      if (notification.method === PluginChannelClientMethod.ready) {
        this.markReady();
      }
    });
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  setHostRequestHandler(handler: LocalDebugHostRequestHandler | null): void {
    this.hostRequestHandler = handler;
  }

  markReady(): void {
    if (this.ready) {
      return;
    }

    this.ready = true;
    this.resolveReady();
  }

  async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  async invokePlugin<TParams, TResult, TInput = unknown, TOutput = unknown>(
    method: string,
    params: TParams,
    options?: PluginChannelRequestOptions<TInput>
  ): Promise<PluginChannelRequestResult<TResult, TOutput>> {
    return this.hostChannel.request(
      PluginChannelHostMethod.request,
      {
        eventName: method,
        payload: params,
        returnStream: true
      },
      options
    ) as Promise<PluginChannelRequestResult<TResult, TOutput>>;
  }

  async dispatchFromSide<
    TSide extends PluginChannelSide,
    TMethod extends keyof PluginChannelSendRequestMap<TSide>
  >(
    side: TSide,
    method: TMethod,
    params: PluginChannelSideRequestParams<TSide, TMethod>,
    options?: PluginChannelRequestOptions<PluginChannelSideRequestInput<TSide, TMethod>>
  ): Promise<
    PluginChannelRequestResult<
      PluginChannelSideRequestResultData<TSide, TMethod>,
      PluginChannelSideRequestOutput<TSide, TMethod>
    >
  > {
    const requestId = options?.id ?? randomUUID();
    const target = side === 'host' ? this.pluginChannel : this.hostChannel;
    const response =
      side === 'client' && method === PluginChannelClientMethod.request
        ? await this.invokeHostRequest(params as never, options)
        : await target.handleRequest({
            id: requestId,
            method: method as never,
            params: params as never,
            ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
            raw: {
              protocol: '1.0',
              id: requestId,
              method: String(method),
              params,
              ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
              timestamp: Date.now()
            },
            waitForInputStream: async () =>
              createIncomingStream({
                source: options?.input ?? StreamData.create<unknown>(),
                streamName: String(method),
                streamId: randomUUID(),
                traceId: options?.traceId
              })
          } as never);

    return toRequestResult(requestId, response, options);
  }

  async notifyFromSide<
    TSide extends PluginChannelSide,
    TMethod extends keyof PluginChannelSendNotificationMap<TSide>
  >(
    side: TSide,
    method: TMethod,
    params: PluginChannelSideNotificationParams<TSide, TMethod>,
    options?: PluginChannelNotifyOptions
  ): Promise<void> {
    const target = side === 'host' ? this.pluginChannel : this.hostChannel;
    await target.handleNotification({
      method: method as never,
      params: params as never,
      ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
      raw: {
        protocol: '1.0',
        method: String(method),
        params,
        ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
        timestamp: Date.now()
      }
    } as never);
  }

  private async invokeHostRequest<TInput>(
    params: { method: string; args: unknown },
    options?: PluginChannelRequestOptions<TInput>
  ): Promise<unknown> {
    if (!this.hostRequestHandler) {
      throw new Error(`Local debug host handler is not configured: ${params.method}`);
    }

    return this.hostRequestHandler({
      method: params.method,
      args: params.args,
      traceId: options?.traceId,
      input: options?.input,
      createReply: <R = unknown, O = unknown>(
        result?: R,
        replyOptions?: {
          output?: PluginChannelStreamSource<O>;
          outputStream?: PluginChannelStreamOptions;
        }
      ) => this.pluginChannel.createReply(result, replyOptions) as LocalDebugReplyDescriptor<R, O>
    });
  }
}

export const createLocalDebugRuntime = (): LocalDebugRuntime => new LocalDebugRuntime();

export const setCurrentLocalDebugRuntime = (runtime?: LocalDebugRuntime): void => {
  const store = globalThis as typeof globalThis & {
    [LOCAL_DEBUG_RUNTIME_GLOBAL_KEY]?: LocalDebugRuntime;
  };

  if (!runtime) {
    delete store[LOCAL_DEBUG_RUNTIME_GLOBAL_KEY];
    return;
  }

  store[LOCAL_DEBUG_RUNTIME_GLOBAL_KEY] = runtime;
};

function isLocalDebugReplyDescriptor<TResult = unknown, TOutput = unknown>(
  value: unknown
): value is LocalDebugReplyDescriptor<TResult, TOutput> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      LOCAL_DEBUG_REPLY_MARK in value &&
      (value as Record<string, unknown>)[LOCAL_DEBUG_REPLY_MARK] === true
  );
}

function toRequestResult<TResult, TOutput>(
  requestId: string | number,
  response: unknown,
  options?: PluginChannelRequestOptions<unknown>
): PluginChannelRequestResult<TResult, TOutput> {
  const inputDone = options?.input !== undefined ? Promise.resolve() : undefined;

  if (!isLocalDebugReplyDescriptor<TResult, TOutput>(response)) {
    return {
      requestId,
      result: response as TResult,
      ...(inputDone ? { inputDone } : {})
    };
  }

  const output =
    response.output !== undefined
      ? createIncomingStream<TOutput>({
          source: response.output,
          streamName: response.outputStream?.streamName ?? 'stream',
          streamId: response.outputStream?.streamId ?? randomUUID(),
          traceId: response.outputStream?.traceId,
          meta: response.outputStream?.meta
        })
      : undefined;

  return {
    requestId,
    result: response.result as TResult,
    ...(output ? { output } : {}),
    ...(inputDone ? { inputDone } : {})
  };
}

function createIncomingStream<T>({
  source,
  streamName,
  streamId,
  traceId,
  meta
}: {
  source: PluginChannelStreamSource<T>;
  streamName: string;
  streamId: string;
  traceId?: string;
  meta?: unknown;
}): PluginChannelIncomingStream<T> {
  return {
    streamId,
    streamName,
    stream: toStreamData(source),
    ...(traceId ? { traceId } : {}),
    ...(meta !== undefined ? { meta } : {})
  };
}

function toStreamData<T>(source: PluginChannelStreamSource<T>): StreamData<T> {
  if (isStreamDataLike<T>(source)) {
    return source;
  }

  const output = StreamData.create<T>();

  void (async () => {
    try {
      for await (const chunk of source) {
        output.send(chunk);
      }
      output.end();
    } catch (error) {
      output.fail(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return output;
}

function isStreamDataLike<T>(source: PluginChannelStreamSource<T>): source is StreamData<T> {
  return (
    source instanceof StreamData ||
    (typeof source === 'object' &&
      source !== null &&
      typeof (source as { values?: unknown }).values === 'function' &&
      typeof (source as { consume?: unknown }).consume === 'function')
  );
}
