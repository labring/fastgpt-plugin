import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import {
  type InvokeChatCompletionInputType,
  type InvokeChatCompletionOutputType,
  type InvokePort,
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType,
  InvokeUserInfoOutputSchema,
  type InvokeUserInfoOutputType,
  type InvokeWecomCorpTokenOutputType,
  parseInvokeChatCompletionInput
} from '@domain/ports/invoke.port';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

export type InvokeUploadFileHandler = (arg: {
  token: string;
  input: InvokeUploadFileInputType;
}) => Promise<Result<InvokeUploadFileOutputType>>;

export type InvokeManagerDeps = {
  token: string;
  fastgptBaseUrl: string;
};

type InvokeUploadFileRequest = {
  formData: FormData;
  meta: {
    fileName: string;
    contentType: string;
  };
};

type SerializedBufferChunk = {
  type: 'Buffer';
  data: number[];
};

const CHAT_COMPLETION_FAILURE_REASON: I18nStringType = {
  en: 'Invoke chat completion failed',
  'zh-CN': '反向调用模型对话失败'
};

const PROTECTED_CHAT_REQUEST_HEADERS = new Set([
  'authorization',
  'connection',
  'content-length',
  'content-type',
  'host',
  'keep-alive',
  'transfer-encoding'
]);

export class InvokeManager implements InvokePort {
  constructor(private readonly deps: InvokeManagerDeps) {}

  async getWecomCorpToken(): Promise<Result<InvokeWecomCorpTokenOutputType>> {
    const [result, responseErr] = await this.requestFastGPT({
      path: '/api/proApi/support/wecom/getCorpToken',
      init: {
        method: 'GET'
      },
      failureReason: {
        en: 'Get wecom corp token failed',
        'zh-CN': '获取企业微信企业令牌失败'
      },
      invalidJsonReason: {
        en: 'Invalid wecom corp token output',
        'zh-CN': '获取企业微信企业令牌返回数据格式错误'
      }
    });

    if (responseErr) return failureResult(responseErr);
    return successResult(result as InvokeWecomCorpTokenOutputType);
  }

  async userInfo(): Promise<Result<InvokeUserInfoOutputType>> {
    const [result, responseErr] = await this.requestFastGPT({
      path: '/api/invoke/userInfo',
      init: {
        method: 'GET'
      },
      failureReason: {
        en: 'Invoke user info failed',
        'zh-CN': '反向调用用户信息失败'
      },
      invalidJsonReason: {
        en: 'Invalid invoke user info output',
        'zh-CN': '反向调用用户信息返回数据格式错误'
      }
    });

    if (responseErr) return failureResult(responseErr);

    try {
      return successResult(InvokeUserInfoOutputSchema.parse(result));
    } catch (error) {
      return failureResult(
        {
          en: 'Invalid invoke user info output',
          'zh-CN': '反向调用用户信息返回数据格式错误'
        },
        error
      );
    }
  }

  async uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    let request: InvokeUploadFileRequest;
    try {
      request = await this.buildUploadFileRequest(input);
    } catch (error) {
      return failureResult(
        {
          en: 'Invoke upload file failed',
          'zh-CN': '反向调用上传文件失败'
        },
        error
      );
    }

    const [result, responseErr] = await this.requestFastGPT<{
      url: string;
    }>({
      path: '/api/invoke/fileUpload',
      init: {
        method: 'POST',
        body: request.formData
      },
      failureReason: {
        en: 'Invoke upload file failed',
        'zh-CN': '反向调用上传文件失败'
      },
      invalidJsonReason: {
        en: 'Invalid invoke upload file output',
        'zh-CN': '反向调用上传文件返回数据格式错误'
      }
    });
    if (responseErr) return failureResult(responseErr);

    try {
      return successResult(
        InvokeUploadFileOutputSchema.parse({
          accessURL: result.url
        })
      );
    } catch (error) {
      return failureResult(
        {
          en: 'Invalid invoke upload file output',
          'zh-CN': '反向调用上传文件返回数据格式错误'
        },
        error
      );
    }
  }

  /**
   * Proxies an OpenAI-compatible chat completion request to FastGPT.
   * Non-2xx HTTP responses from FastGPT are returned as `successResult({ status, headers, body })`
   * so downstream OpenAI clients can reconstruct exact `APIError` instances, whereas transport or
   * input validation failures before FastGPT responds return `failureResult(...)`.
   */
  async chatCompletion(
    input: InvokeChatCompletionInputType,
    options?: { signal?: AbortSignal }
  ): Promise<Result<InvokeChatCompletionOutputType>> {
    const [parsedInput, inputErr] = parseInvokeChatCompletionInput(input);
    if (inputErr) {
      return [null, inputErr];
    }

    let serializedBody: string;
    try {
      serializedBody = JSON.stringify(parsedInput.body);
    } catch (error) {
      return failureResult(CHAT_COMPLETION_FAILURE_REASON, error);
    }

    const headers = new Headers();
    if (parsedInput.headers) {
      for (const [key, value] of Object.entries(parsedInput.headers)) {
        if (!PROTECTED_CHAT_REQUEST_HEADERS.has(key.toLowerCase())) {
          headers.set(key, value);
        }
      }
    }
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${this.deps.token}`);

    let response: Response;
    try {
      response = await fetch(this.buildUrl('/api/invoke/llm/chat/completions'), {
        method: 'POST',
        headers,
        body: serializedBody,
        ...(options?.signal ? { signal: options.signal } : {})
      });
    } catch (error) {
      return failureResult(CHAT_COMPLETION_FAILURE_REASON, error);
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isEventStream = contentType.toLowerCase().includes('text/event-stream');

    if (response.ok && isEventStream && response.body) {
      return successResult({
        status: response.status,
        headers: responseHeaders,
        stream: this.bridgeWebStreamToStreamData(response.body, options?.signal)
      });
    }

    let rawText: string;
    try {
      rawText = await response.text();
    } catch (error) {
      return failureResult(CHAT_COMPLETION_FAILURE_REASON, error);
    }

    return successResult({
      status: response.status,
      headers: responseHeaders,
      body: this.parseChatCompletionBody(rawText, contentType)
    });
  }

  private bridgeWebStreamToStreamData(
    webStream: ReadableStream<Uint8Array>,
    signal?: AbortSignal
  ): StreamData<Uint8Array> {
    const streamData = StreamData.create<Uint8Array>();
    const readable = streamData.toReadable();
    // Guard against uncaught EventEmitter 'error' throws if upstream fails before an async reader attaches.
    readable.on('error', () => {});

    const reader = webStream.getReader();
    let cancelled = false;
    let streamDone = false;

    const cancelUpstream = () => {
      if (cancelled || streamDone) {
        return;
      }
      cancelled = true;
      void reader.cancel().catch(() => {});
      if (!readable.destroyed) {
        readable.destroy();
      }
    };

    readable.once('close', cancelUpstream);
    if (signal?.aborted) {
      cancelUpstream();
    } else {
      signal?.addEventListener('abort', cancelUpstream, { once: true });
    }

    void (async () => {
      try {
        while (!cancelled && !readable.destroyed) {
          const { done, value } = await reader.read();
          if (done) {
            streamDone = true;
            if (!cancelled && !readable.destroyed) {
              streamData.end();
            }
            break;
          }
          if (cancelled || readable.destroyed) {
            break;
          }
          if (value && value.byteLength > 0) {
            streamData.write(value);
          }
        }
      } catch (error) {
        if (!cancelled && !readable.destroyed) {
          try {
            streamData.fail(error instanceof Error ? error : new Error(String(error)));
          } catch {
            // Stream was already closed externally.
          }
        }
      } finally {
        readable.off('close', cancelUpstream);
        signal?.removeEventListener('abort', cancelUpstream);
        cancelUpstream();
        try {
          reader.releaseLock();
        } catch {
          // Reader lock may still be settling after cancel.
        }
      }
    })();

    return streamData;
  }

  private parseChatCompletionBody(rawText: string, contentType: string): unknown {
    if (rawText.length === 0) {
      return '';
    }

    const trimmed = rawText.trimStart();
    const looksLikeJson =
      contentType.toLowerCase().includes('json') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[');

    if (!looksLikeJson) {
      return rawText;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return rawText;
    }
  }

  private buildUrl(path: string): string {
    return new URL(path, this.deps.fastgptBaseUrl).toString();
  }

  private async buildUploadFileRequest(
    input: InvokeUploadFileInputType
  ): Promise<InvokeUploadFileRequest> {
    const formData = new FormData();
    const fileBuffer = await this.toBuffer(input.file);
    const fileName = input.fileName ?? randomUUID();
    const contentType = input.contentType ?? 'application/octet-stream';
    const blobPart = new Uint8Array(fileBuffer.byteLength);

    blobPart.set(fileBuffer);
    formData.append('file', new Blob([blobPart], { type: contentType }), fileName);
    if (input.fileName) formData.append('fileName', input.fileName);
    if (input.contentType) formData.append('contentType', input.contentType);

    return {
      formData,
      meta: {
        fileName,
        contentType
      }
    };
  }

  private async toBuffer(file: InvokeUploadFileInputType['file']): Promise<Buffer> {
    if (Buffer.isBuffer(file)) return file;
    if (file instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(this.toBufferChunk(chunk));
      }
      return Buffer.concat(chunks);
    }
    return Buffer.from(file);
  }

  private toBufferChunk(chunk: unknown): Buffer {
    if (Buffer.isBuffer(chunk)) return chunk;
    if (chunk instanceof Uint8Array) return Buffer.from(chunk);
    if (chunk instanceof ArrayBuffer) return Buffer.from(chunk);
    if (ArrayBuffer.isView(chunk)) {
      return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    }
    if (typeof chunk === 'string') return Buffer.from(chunk);
    if (typeof chunk === 'number') return Buffer.from([chunk]);
    if (this.isSerializedBufferChunk(chunk)) return Buffer.from(chunk.data);

    throw new TypeError(
      `Unsupported upload file stream chunk type: ${Object.prototype.toString.call(chunk)}`
    );
  }

  private isSerializedBufferChunk(value: unknown): value is SerializedBufferChunk {
    return (
      this.isRecord(value) &&
      value.type === 'Buffer' &&
      Array.isArray(value.data) &&
      value.data.every(
        (item) => Number.isInteger(item) && Number.isSafeInteger(item) && item >= 0 && item <= 255
      )
    );
  }

  private async requestFastGPT<T = unknown>({
    path,
    init,
    failureReason,
    invalidJsonReason
  }: {
    path: string;
    init?: RequestInit;
    failureReason: I18nStringType;
    invalidJsonReason: I18nStringType;
  }): Promise<Result<T>> {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${this.deps.token}`);

    let response: Response;
    try {
      response = await fetch(this.buildUrl(path), {
        ...init,
        headers
      });
    } catch (error) {
      return failureResult(failureReason, error);
    }

    if (!response.ok) {
      return failureResult(failureReason, await this.readErrorResponse(response));
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      return failureResult(invalidJsonReason, error);
    }

    return this.parseResponse<T>(payload, failureReason);
  }

  private parseResponse<T = unknown>(payload: unknown, fallbackReason: I18nStringType): Result<T> {
    if (!this.isRecord(payload)) return successResult(payload as T);

    if (payload.success === false) {
      return failureResult(
        {
          en: this.getResponseMessage(payload) ?? fallbackReason.en,
          'zh-CN': this.getResponseMessage(payload) ?? fallbackReason['zh-CN']
        },
        payload
      );
    }

    if (typeof payload.code === 'number' && payload.code >= 400) {
      return failureResult(
        {
          en: this.getResponseMessage(payload) ?? fallbackReason.en,
          'zh-CN': this.getResponseMessage(payload) ?? fallbackReason['zh-CN']
        },
        payload
      );
    }

    return successResult(('data' in payload ? payload.data : payload) as T);
  }

  private async readErrorResponse(response: Response) {
    return {
      status: response.status,
      statusText: response.statusText,
      body: (await response.text().catch(() => '')).slice(0, 1000)
    };
  }

  private getResponseMessage(payload: Record<string, unknown>): string | undefined {
    return typeof payload.message === 'string' ? payload.message : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }
}
