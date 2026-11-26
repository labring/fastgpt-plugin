import OpenAI from 'openai';
import Stream from 'stream';

import {
  type InvokeChatCompletionInputType,
  type InvokeChatCompletionOutputType,
  type InvokeChatCompletionReplyMetaType,
  type InvokeChatCompletionStreamChunkType,
  type InvokeChatCompletionStreamSourceType,
  InvokeMethodEnum,
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType,
  type InvokeUserInfoOutputType,
  type InvokeWecomCorpTokenOutputType
} from '@domain/ports/invoke.port';
import {
  failureResult,
  type Result,
  type ResultFailure,
  successResult
} from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import { PluginChannelClientMethod } from '@infrastructure/plugin/plugin-runtime/ports/channel';
import { getErrText } from '@shared/utils/err';

import type { PluginRuntimeChannel } from './runtime-channel.type';

const VIRTUAL_OPENAI_API_KEY = 'fastgpt-invoke';
const VIRTUAL_OPENAI_BASE_URL = 'http://fastgpt-invoke.local/v1';

const CHAT_COMPLETION_FAILURE_REASON = {
  en: 'Failed to invoke chat completion',
  'zh-CN': '反向调用模型对话失败'
} as const;

const OMITTED_MODEL_REQUEST_HEADERS = new Set([
  'accept',
  'authorization',
  'connection',
  'content-length',
  'content-type',
  'cookie',
  'host',
  'keep-alive',
  'proxy-authorization',
  'transfer-encoding',
  'user-agent'
]);

const OMITTED_MODEL_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'transfer-encoding'
]);

type SerializedBufferChunk = {
  type: 'Buffer';
  data: number[];
};

/**
 * SDK-facing reverse invocation client interface exposed on `ctx.invoke`.
 * Extends `InvokePort` with a required `chatCompletion` method and `createModelClient()`.
 */
export interface ToolInvokeClient
  extends Omit<InvokePort, 'chatCompletion'>,
    Required<Pick<InvokePort, 'chatCompletion'>> {
  /**
   * Creates a standard official `OpenAI` SDK client proxied through the FastGPT host channel.
   */
  createModelClient(): OpenAI;
}

/**
 * 实现反向调用的 Client 侧方法
 */
export class InvokeClient implements ToolInvokeClient {
  constructor(
    private channel: PluginRuntimeChannel,
    private readonly options: { invocationId?: string } = {}
  ) {}

  async getWecomCorpToken(): Promise<Result<InvokeWecomCorpTokenOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.wecomCorpToken,
          args: {}
        },
        {
          traceId: this.options.invocationId
        }
      );

      const [result, responseErr] = response.result as [InvokeWecomCorpTokenOutputType, unknown];
      if (responseErr)
        return failureResult(
          { en: 'Failed to get wecom corp token', 'zh-CN': '获取企业微信企业令牌失败' },
          responseErr
        );
      return successResult(result);
    } catch (error) {
      return failureResult(
        { en: 'Failed to get wecom corp token', 'zh-CN': '获取企业微信企业令牌失败' },
        error
      );
    }
  }

  async userInfo(): Promise<Result<InvokeUserInfoOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.userInfo,
          args: {}
        },
        {
          traceId: this.options.invocationId
        }
      );

      const [result, responseErr] = response.result as [InvokeUserInfoOutputType, unknown];
      if (responseErr)
        return failureResult(
          {
            en: 'Failed to get user info',
            'zh-CN': '获取用户信息失败'
          },
          responseErr
        );
      return successResult(result);
    } catch (error) {
      return failureResult({ en: 'Failed to get user info', 'zh-CN': '获取用户信息失败' }, error);
    }
  }

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.uploadFile,
          args: {
            contentType: input.contentType,
            fileName: input.fileName
          }
        },
        {
          traceId: this.options.invocationId,
          input: this.toUploadInputStream(input.file)
        }
      );

      const [result, err] = response.result as [InvokeUploadFileOutputType, unknown];
      if (err)
        return failureResult(
          {
            en: 'Failed to upload file',
            'zh-CN': '上传文件失败'
          },
          err
        );

      return successResult(InvokeUploadFileOutputSchema.parse(result));
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to upload file',
          'zh-CN': '上传文件失败'
        },
        error
      );
    }
  }

  /**
   * Sends a `chatCompletion` reverse invocation request over the runtime channel.
   * Streaming responses return a Node `Readable` converted from `response.output.stream`;
   * JSON and HTTP error responses return `{ status, headers, body }`.
   */
  async chatCompletion(
    input: InvokeChatCompletionInputType
  ): Promise<Result<InvokeChatCompletionOutputType>> {
    try {
      const response = await this.channel.request(
        PluginChannelClientMethod.request,
        {
          method: InvokeMethodEnum.chatCompletion,
          args: input
        },
        {
          traceId: this.options.invocationId
        }
      );

      if (!Array.isArray(response.result)) {
        if (response.output) {
          this.destroyStreamSource(response.output.stream);
        }
        return failureResult(
          CHAT_COMPLETION_FAILURE_REASON,
          new Error('Invalid chat completion response from host channel')
        );
      }

      const [result, responseErr] = response.result as [
        InvokeChatCompletionReplyMetaType | null,
        unknown
      ];
      if (responseErr || !result) {
        if (response.output) {
          this.destroyStreamSource(response.output.stream);
        }
        return failureResult(CHAT_COMPLETION_FAILURE_REASON, responseErr);
      }

      if (response.output) {
        const readable = this.toIncomingReadable(
          response.output.stream as StreamData<InvokeChatCompletionStreamChunkType>
        );
        return successResult({
          status: result.status,
          headers: result.headers ?? {},
          stream: readable
        });
      }

      return successResult({
        status: result.status,
        headers: result.headers ?? {},
        body: result.body
      });
    } catch (error) {
      return failureResult(CHAT_COMPLETION_FAILURE_REASON, error);
    }
  }

  /**
   * Creates an authentic official `OpenAI` client whose HTTP transport is bridged
   * over `PluginRuntimeChannel` via `this.chatCompletion(...)`.
   */
  createModelClient(): OpenAI {
    return new OpenAI({
      apiKey: VIRTUAL_OPENAI_API_KEY,
      baseURL: VIRTUAL_OPENAI_BASE_URL,
      fetch: (input, init) => this.fetchModelCompletion(input, init)
    });
  }

  private async fetchModelCompletion(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const requestObject =
      typeof input === 'object' && !(input instanceof URL) ? input : undefined;
    const signal = init?.signal ?? requestObject?.signal ?? undefined;

    if (signal?.aborted) {
      throw createAbortError(signal.reason);
    }

    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method ?? requestObject?.method ?? 'GET').toUpperCase();

    let pathname: string;
    try {
      pathname = new URL(rawUrl, VIRTUAL_OPENAI_BASE_URL).pathname;
    } catch {
      return createInvokeErrorResponse(400, `Invalid model invoke URL: ${rawUrl}`);
    }

    if (!pathname.endsWith('/chat/completions')) {
      return createInvokeErrorResponse(
        404,
        `Unsupported model invoke path: ${pathname}. Only POST /chat/completions is supported.`
      );
    }

    if (method !== 'POST') {
      return createInvokeErrorResponse(
        400,
        `Unsupported HTTP method ${method} for ${pathname}. Only POST /chat/completions is supported.`
      );
    }

    let parsedBody: Record<string, unknown>;
    try {
      const rawBody = await readRequestBodyText(requestObject, init?.body);
      const parsed = JSON.parse(rawBody) as unknown;
      if (!isPlainRecord(parsed)) {
        return createInvokeErrorResponse(
          400,
          'Chat completions request body must be a JSON object.'
        );
      }
      parsedBody = parsed;
    } catch (error) {
      if (signal?.aborted) {
        throw createAbortError(signal.reason);
      }
      return createInvokeErrorResponse(
        400,
        `Invalid JSON body for chat completions: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const sanitizedHeaders = extractSanitizedRequestHeaders(requestObject?.headers, init?.headers);
    const invokePromise = this.chatCompletion({
      body: parsedBody,
      ...(sanitizedHeaders ? { headers: sanitizedHeaders } : {})
    });

    const [result, invokeErr] = await this.raceWithAbort(invokePromise, signal);
    if (invokeErr) {
      const message = getErrText(invokeErr, CHAT_COMPLETION_FAILURE_REASON.en);
      const status = isPermissionFailure(invokeErr, message) ? 403 : 502;
      return createInvokeErrorResponse(status, message, invokeErr.code);
    }

    if (result.stream) {
      const responseHeaders = buildResponseHeaders(result.headers, 'text/event-stream');
      const webStream = this.bridgeSourceToWebStream(result.stream, signal);
      return new Response(webStream, {
        status: result.status,
        headers: responseHeaders
      });
    }

    const isEmptyBody = result.body === undefined || result.status === 204;
    const defaultContentType = isEmptyBody ? undefined : 'application/json';
    const responseHeaders = buildResponseHeaders(result.headers, defaultContentType);
    const serializedBody = isEmptyBody
      ? null
      : typeof result.body === 'string'
        ? result.body
        : JSON.stringify(result.body);

    return new Response(serializedBody, {
      status: result.status,
      headers: responseHeaders
    });
  }

  private async raceWithAbort(
    invokePromise: Promise<Result<InvokeChatCompletionOutputType>>,
    signal?: AbortSignal
  ): Promise<Result<InvokeChatCompletionOutputType>> {
    if (!signal) {
      return invokePromise;
    }
    if (signal.aborted) {
      this.cleanupAbortedInvokePromise(invokePromise);
      throw createAbortError(signal.reason);
    }

    let onAbort: (() => void) | undefined;
    const abortPromise = new Promise<never>((_, reject) => {
      onAbort = () => {
        this.cleanupAbortedInvokePromise(invokePromise);
        reject(createAbortError(signal.reason));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });

    try {
      return await Promise.race([invokePromise, abortPromise]);
    } finally {
      if (onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
    }
  }

  private cleanupAbortedInvokePromise(
    invokePromise: Promise<Result<InvokeChatCompletionOutputType>>
  ): void {
    void invokePromise
      .then(([res]) => {
        if (res?.stream) {
          this.destroyStreamSource(res.stream);
        }
      })
      .catch(() => {});
  }

  private bridgeSourceToWebStream(
    source: InvokeChatCompletionStreamSourceType,
    signal?: AbortSignal
  ): ReadableStream<Uint8Array> {
    const readable = this.toIncomingReadable(source);
    const encoder = new TextEncoder();
    let settled = false;
    let cleanupListeners: (() => void) | undefined;

    // Prevent uncaught EventEmitter error throws if source errors before or after bridging.
    readable.on('error', () => {});

    return new ReadableStream<Uint8Array>({
      start(controller) {
        if (signal?.aborted) {
          settled = true;
          if (!readable.destroyed) {
            readable.destroy();
          }
          controller.error(createAbortError(signal.reason));
          return;
        }

        if (readable.readableEnded && readable.readableLength === 0) {
          settled = true;
          controller.close();
          return;
        }

        const onData = (chunk: unknown) => {
          if (settled) {
            return;
          }
          try {
            const bytes = toUint8ArrayChunk(chunk, encoder);
            if (bytes.byteLength > 0) {
              controller.enqueue(bytes);
              if (controller.desiredSize !== null && controller.desiredSize <= 0) {
                readable.pause();
              }
            }
          } catch (error) {
            settled = true;
            cleanupListeners?.();
            if (!readable.destroyed) {
              readable.destroy();
            }
            controller.error(error);
          }
        };

        const onEnd = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanupListeners?.();
          try {
            controller.close();
          } catch {
            // Stream controller was already closed.
          }
        };

        const onError = (error: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanupListeners?.();
          try {
            controller.error(error instanceof Error ? error : new Error(String(error)));
          } catch {
            // Stream controller was already closed.
          }
        };

        const onClose = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanupListeners?.();
          try {
            controller.close();
          } catch {
            // Stream controller was already closed.
          }
        };

        const onAbort = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanupListeners?.();
          if (!readable.destroyed) {
            readable.destroy();
          }
          try {
            controller.error(createAbortError(signal?.reason));
          } catch {
            // Stream controller was already closed.
          }
        };

        cleanupListeners = () => {
          readable.off('data', onData);
          readable.off('end', onEnd);
          readable.off('error', onError);
          readable.off('close', onClose);
          signal?.removeEventListener('abort', onAbort);
        };

        signal?.addEventListener('abort', onAbort, { once: true });
        readable.on('error', onError);
        readable.on('end', onEnd);
        readable.on('close', onClose);
        readable.on('data', onData);
      },
      pull() {
        if (!settled && readable.isPaused()) {
          readable.resume();
        }
      },
      cancel() {
        if (settled) {
          return;
        }
        settled = true;
        cleanupListeners?.();
        if (!readable.destroyed) {
          readable.destroy();
        }
      }
    });
  }

  private toIncomingReadable(
    source: InvokeChatCompletionStreamSourceType | AsyncIterable<unknown>
  ): Stream.Readable {
    if (source instanceof Stream.Readable) {
      return source;
    }
    if (
      source &&
      typeof source === 'object' &&
      'toReadable' in source &&
      typeof (source as StreamData<InvokeChatCompletionStreamChunkType>).toReadable === 'function'
    ) {
      return (source as StreamData<InvokeChatCompletionStreamChunkType>).toReadable();
    }
    if (
      source &&
      typeof source === 'object' &&
      'values' in source &&
      typeof (source as StreamData<InvokeChatCompletionStreamChunkType>).values === 'function'
    ) {
      return Stream.Readable.from(
        (source as StreamData<InvokeChatCompletionStreamChunkType>).values()
      );
    }
    return Stream.Readable.from(source as AsyncIterable<unknown>);
  }

  private destroyStreamSource(source: unknown): void {
    try {
      const readable = this.toIncomingReadable(source as InvokeChatCompletionStreamSourceType);
      readable.on('error', () => {});
      if (!readable.destroyed) {
        readable.destroy();
      }
    } catch {
      // Ignore cleanup errors on malformed sources.
    }
  }

  private toUploadInputStream(file: InvokeUploadFileInputType['file']): Stream.Readable {
    if (file instanceof Stream.Readable) return file;
    return Stream.Readable.from(Buffer.from(file));
  }
}

function createInvokeErrorResponse(status: number, message: string, code?: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: 'fastgpt_invoke_error',
        ...(code ? { code } : {})
      }
    }),
    {
      status,
      headers: {
        'content-type': 'application/json',
        'x-should-retry': 'false'
      }
    }
  );
}

function createAbortError(reason?: unknown): Error {
  if (
    reason &&
    typeof reason === 'object' &&
    'name' in reason &&
    (reason as { name?: unknown }).name === 'AbortError' &&
    reason instanceof Error
  ) {
    return reason;
  }

  if (typeof DOMException === 'function') {
    return new DOMException('The operation was aborted.', 'AbortError');
  }

  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

async function readRequestBodyText(
  requestObject: Request | undefined,
  body: BodyInit | null | undefined
): Promise<string> {
  if (typeof body === 'string') {
    return body;
  }
  if (body instanceof Uint8Array) {
    return new TextDecoder().decode(body);
  }
  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(body));
  }
  if (ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(
      new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
    );
  }
  if (body !== undefined && body !== null) {
    return new Response(body).text();
  }
  if (requestObject) {
    return requestObject.text();
  }
  return '';
}

function extractSanitizedRequestHeaders(
  requestHeaders?: HeadersInit,
  initHeaders?: HeadersInit
): Record<string, string> | undefined {
  const merged = new Headers(requestHeaders);
  if (initHeaders) {
    new Headers(initHeaders).forEach((value, key) => {
      merged.set(key, value);
    });
  }

  const sanitized: Record<string, string> = {};
  let hasHeader = false;
  merged.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (OMITTED_MODEL_REQUEST_HEADERS.has(lower) || lower.startsWith('x-stainless-')) {
      return;
    }
    sanitized[key] = value;
    hasHeader = true;
  });

  return hasHeader ? sanitized : undefined;
}

function buildResponseHeaders(
  rawHeaders: Record<string, string> | undefined,
  defaultContentType?: string
): Headers {
  const headers = new Headers();
  if (rawHeaders) {
    for (const [key, value] of Object.entries(rawHeaders)) {
      if (!OMITTED_MODEL_RESPONSE_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
  }
  if (defaultContentType && !headers.has('content-type')) {
    headers.set('content-type', defaultContentType);
  }
  return headers;
}

function isPermissionFailure(failure: ResultFailure, formattedMessage: string): boolean {
  const candidates = [
    failure.code,
    failure.message,
    failure.reason?.en,
    failure.reason?.['zh-CN'],
    formattedMessage
  ];
  return candidates.some(
    (item) =>
      typeof item === 'string' &&
      /permission|forbidden|unauthori[sz]ed|model:invoke|权限|未授权/i.test(item)
  );
}

function toUint8ArrayChunk(chunk: unknown, encoder: TextEncoder): Uint8Array {
  if (Buffer.isBuffer(chunk)) {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
  if (chunk instanceof Uint8Array) {
    return chunk;
  }
  if (typeof chunk === 'string') {
    return encoder.encode(chunk);
  }
  if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk);
  }
  if (ArrayBuffer.isView(chunk)) {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
  if (isSerializedBufferChunk(chunk)) {
    return Uint8Array.from(chunk.data);
  }
  if (isNumericByteRecord(chunk)) {
    const length = Object.keys(chunk).length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = chunk[i]!;
    }
    return bytes;
  }

  throw new TypeError(
    `Unsupported chatCompletion stream chunk type: ${Object.prototype.toString.call(chunk)}`
  );
}

function isSerializedBufferChunk(value: unknown): value is SerializedBufferChunk {
  return (
    isPlainRecord(value) &&
    value.type === 'Buffer' &&
    Array.isArray(value.data) &&
    value.data.every(
      (item) => Number.isInteger(item) && Number.isSafeInteger(item) && item >= 0 && item <= 255
    )
  );
}

function isNumericByteRecord(value: unknown): value is Record<number, number> {
  if (!isPlainRecord(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return false;
  }
  for (let i = 0; i < keys.length; i++) {
    const item = value[String(i)];
    if (
      typeof item !== 'number' ||
      !Number.isInteger(item) ||
      item < 0 ||
      item > 255
    ) {
      return false;
    }
  }
  return true;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
