import { randomUUID } from 'node:crypto';

import { StreamData } from '@domain/value-objects/stream.vo';
import type {
  PluginIpcDuplexReplyOptions,
  PluginIpcDuplexRequestOptions,
  PluginIpcDuplexResponse,
  PluginIpcIncomingStream,
  PluginIpcRequestHandler,
  PluginIpcStreamSource
} from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';
import type { PluginIOMessage } from '@infrastructure/plugin/plugin-runtime/ports/plugin-io.port';

const LOCAL_DEBUG_RUNTIME_GLOBAL_KEY = '__FASTGPT_PLUGIN_LOCAL_DEBUG_RUNTIME__';
const LOCAL_DEBUG_DUPLEX_REPLY_MARK = '__localDebugDuplexReply__';

type LocalDebugReplyDescriptor<TResult = unknown, TOutput = unknown> = {
  [LOCAL_DEBUG_DUPLEX_REPLY_MARK]: true;
  result?: TResult;
  output?: PluginIpcStreamSource<TOutput>;
  options?: {
    traceId?: string;
    outputStreamId?: string;
    outputMeta?: unknown;
  };
};

type PluginRuntimeChannel = {
  setRequestHandler(handler: PluginIpcRequestHandler | null): void;
  requestDuplex<TParams, TResult, TInput = unknown, TOutput = unknown>(
    method: string,
    params: TParams,
    options?: PluginIpcDuplexRequestOptions<TInput>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>>;
  replyDuplex<TResult = unknown, TOutput = unknown>(
    message: PluginIOMessage,
    result?: TResult,
    options?: PluginIpcDuplexReplyOptions<TOutput>
  ): LocalDebugReplyDescriptor<TResult, TOutput>;
  sendReady(): void;
};

export interface LocalDebugHostRequestContext<TArgs = unknown, TInput = unknown> {
  message: PluginIOMessage;
  method: string;
  args: TArgs;
  traceId?: string;
  input?: PluginIpcStreamSource<TInput>;
  replyDuplex<TResult = unknown, TOutput = unknown>(
    result?: TResult,
    options?: PluginIpcDuplexReplyOptions<TOutput>
  ): LocalDebugReplyDescriptor<TResult, TOutput>;
}

export type LocalDebugHostRequestHandler = (
  request: LocalDebugHostRequestContext
) => Promise<unknown> | unknown;

type DispatchOptions<TInput> = PluginIpcDuplexRequestOptions<TInput> & {
  streamName: string;
};

class LocalDebugChannel implements PluginRuntimeChannel {
  constructor(private readonly runtime: LocalDebugRuntime) {}

  setRequestHandler(handler: PluginIpcRequestHandler | null): void {
    this.runtime.setPluginRequestHandler(handler);
  }

  async requestDuplex<TParams, TResult, TInput = unknown, TOutput = unknown>(
    method: string,
    params: TParams,
    options?: PluginIpcDuplexRequestOptions<TInput>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>> {
    return this.runtime.invokeHost(method, params, {
      ...options,
      streamName: method
    });
  }

  replyDuplex<TResult = unknown, TOutput = unknown>(
    _message: PluginIOMessage,
    result?: TResult,
    options?: PluginIpcDuplexReplyOptions<TOutput>
  ): LocalDebugReplyDescriptor<TResult, TOutput> {
    return {
      [LOCAL_DEBUG_DUPLEX_REPLY_MARK]: true,
      ...(result !== undefined ? { result } : {}),
      ...(options?.output !== undefined ? { output: options.output } : {}),
      ...(options
        ? {
            options: {
              traceId: options.traceId,
              outputMeta: options.outputMeta,
              outputStreamId: options.outputStreamId
            }
          }
        : {})
    };
  }

  sendReady(): void {
    this.runtime.markReady();
  }
}

export class LocalDebugRuntime {
  private pluginRequestHandler: PluginIpcRequestHandler | null = null;
  private hostRequestHandler: LocalDebugHostRequestHandler | null = null;
  private ready = false;
  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  readonly pluginChannel: PluginRuntimeChannel;

  constructor() {
    this.pluginChannel = new LocalDebugChannel(this);
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  setPluginRequestHandler(handler: PluginIpcRequestHandler | null): void {
    this.pluginRequestHandler = handler;
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
    options?: PluginIpcDuplexRequestOptions<TInput>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>> {
    if (!this.pluginRequestHandler) {
      throw new Error('Plugin request handler is not initialized.');
    }

    return this.dispatch<TResult, TOutput>(this.pluginRequestHandler, method, params, {
      ...options,
      streamName: method
    });
  }

  async invokeHost<TParams, TResult, TInput = unknown, TOutput = unknown>(
    method: string,
    params: TParams,
    options: DispatchOptions<TInput>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>> {
    if (!this.hostRequestHandler) {
      throw new Error(`Local debug host handler is not configured: ${method}`);
    }

    const message = createMessage(method, params, options);
    const response = await this.hostRequestHandler({
      message,
      method,
      args: params,
      traceId: options.traceId,
      input: options.input,
      replyDuplex: <R = unknown, O = unknown>(
        result?: R,
        replyOptions?: PluginIpcDuplexReplyOptions<O>
      ) => this.pluginChannel.replyDuplex(message, result, replyOptions)
    });

    return toDuplexResponse<TResult, TOutput>(message, response, options);
  }

  private async dispatch<TResult, TOutput>(
    handler: PluginIpcRequestHandler,
    method: string,
    params: unknown,
    options: DispatchOptions<unknown>
  ): Promise<PluginIpcDuplexResponse<TResult, TOutput>> {
    const message = createMessage(method, params, options);
    const response = await handler(message);
    return toDuplexResponse<TResult, TOutput>(message, response, options);
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

function createMessage(
  method: string,
  params: unknown,
  options?: PluginIpcDuplexRequestOptions<unknown>
): PluginIOMessage {
  return {
    id: options?.requestId ?? randomUUID(),
    messageType: 'request',
    method,
    params,
    traceId: options?.traceId,
    timestamp: Date.now()
  };
}

function isLocalDebugReplyDescriptor<TResult = unknown, TOutput = unknown>(
  value: unknown
): value is LocalDebugReplyDescriptor<TResult, TOutput> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      LOCAL_DEBUG_DUPLEX_REPLY_MARK in value &&
      (value as Record<string, unknown>)[LOCAL_DEBUG_DUPLEX_REPLY_MARK] === true
  );
}

function toDuplexResponse<TResult, TOutput>(
  message: PluginIOMessage,
  response: unknown,
  options?: PluginIpcDuplexRequestOptions<unknown> & {
    streamName?: string;
  }
): PluginIpcDuplexResponse<TResult, TOutput> {
  const inputDone = options?.input !== undefined ? Promise.resolve() : undefined;

  if (!isLocalDebugReplyDescriptor<TResult, TOutput>(response)) {
    return {
      requestId: message.id,
      result: response as TResult,
      ...(inputDone ? { inputDone } : {})
    };
  }

  const output =
    response.output !== undefined
      ? createIncomingStream<TOutput>({
          source: response.output,
          streamName:
            response.options?.outputStreamId ?? options?.streamName ?? message.method ?? 'stream',
          streamId: response.options?.outputStreamId ?? randomUUID(),
          traceId: response.options?.traceId ?? message.traceId,
          meta: response.options?.outputMeta
        })
      : undefined;

  return {
    requestId: message.id,
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
  source: PluginIpcStreamSource<T>;
  streamName: string;
  streamId: string;
  traceId?: string;
  meta?: unknown;
}): PluginIpcIncomingStream<T> {
  return {
    streamId,
    streamName,
    stream: toStreamData(source),
    ...(traceId ? { traceId } : {}),
    ...(meta !== undefined ? { meta } : {})
  };
}

function toStreamData<T>(source: PluginIpcStreamSource<T>): StreamData<T> {
  if (source instanceof StreamData) {
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
