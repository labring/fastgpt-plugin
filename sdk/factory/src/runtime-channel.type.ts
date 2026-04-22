import type {
  PluginIpcDuplexReplyOptions,
  PluginIpcDuplexRequestOptions,
  PluginIpcDuplexResponse,
  PluginIpcRequestHandler
} from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';
import type { PluginIOMessage } from '@infrastructure/plugin/plugin-runtime/ports/plugin-io.port';

export interface PluginRuntimeChannel {
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
  ): unknown;
  sendReady(): void;
}

export interface LocalDebugRuntimeLike {
  pluginChannel: PluginRuntimeChannel;
}

export const LOCAL_DEBUG_RUNTIME_GLOBAL_KEY = '__FASTGPT_PLUGIN_LOCAL_DEBUG_RUNTIME__';
