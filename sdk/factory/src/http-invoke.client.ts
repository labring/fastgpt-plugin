import type {
  InvokePort,
  InvokeUploadFileInputType,
  InvokeUploadFileOutputType,
  InvokeUserInfoOutputType,
  InvokeWecomCorpTokenOutputType
} from '@domain/ports/invoke.port';
import { failureResult, type Result } from '@domain/value-objects/result.vo';

export type HttpInvokeClientOptions = {
  gatewayUrl: string;
  token: string;
  invocationId: string;
  tenantId: string;
  pluginId: string;
  signal: AbortSignal;
  fetch?: typeof fetch;
};

/** Request-scoped client. The gateway returns the domain Result tuple as JSON. */
export class HttpInvokeClient implements InvokePort {
  constructor(private readonly options: HttpInvokeClientOptions) {}

  userInfo(): Promise<Result<InvokeUserInfoOutputType>> {
    return this.request('userInfo');
  }

  getWecomCorpToken(): Promise<Result<InvokeWecomCorpTokenOutputType>> {
    return this.request('wecomCorpToken');
  }

  uploadFile(input: InvokeUploadFileInputType): Promise<Result<InvokeUploadFileOutputType>> {
    const headers = new Headers({
      'Content-Type': input.contentType ?? 'application/octet-stream'
    });
    if (input.fileName) headers.set('x-fastgpt-file-name', encodeURIComponent(input.fileName));
    const file = input.file;
    // Accept byte arrays and async iterable byte streams without importing Node streams.
    const body = file instanceof Uint8Array
      ? new Uint8Array(file)
      : byteStream(file);
    return this.request('uploadFile', body, headers);
  }

  private async request<T>(method: string, body?: BodyInit, extraHeaders?: Headers): Promise<Result<T>> {
    try {
      this.options.signal.throwIfAborted();
      if (!this.options.token || !this.options.invocationId) throw new Error('Missing reverse invocation context');
      const headers = new Headers(extraHeaders);
      headers.set('Authorization', `Bearer ${this.options.token}`);
      headers.set('x-fastgpt-tenant-id', this.options.tenantId);
      headers.set('x-fastgpt-plugin-id', this.options.pluginId);
      headers.set('x-fastgpt-invocation-id', this.options.invocationId);
      if (!body) headers.set('Content-Type', 'application/json');
      const response = await (this.options.fetch ?? globalThis.fetch)(
        `${this.options.gatewayUrl.replace(/\/+$/, '')}/${method}`,
        {
          method: 'POST',
          headers,
          body: body ?? '{}',
          signal: this.options.signal,
          // workerd supports follow/manual only. Non-2xx (including redirects) fail below.
          redirect: 'manual',
          ...(body instanceof ReadableStream ? { duplex: 'half' } : {})
        }
      );
      if (!response.ok) throw new Error(`Invoke gateway returned HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (!Array.isArray(result) || result.length !== 2) {
        throw new Error('Invalid invoke gateway Result');
      }
      if (result[1] !== null) {
        throw new Error('Host reverse invocation failed');
      }
      return [result[0] as T, null];
    } catch (error) {
      return failureResult(
        { en: 'Host reverse invocation failed', 'zh-CN': '反向调用宿主失败' },
        error
      );
    }
  }
}

function byteStream(source: AsyncIterable<unknown>): ReadableStream<Uint8Array> {
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await iterator.next();
      if (done) controller.close();
      else if (value instanceof Uint8Array) controller.enqueue(value);
      else controller.error(new Error('Upload stream must contain byte arrays'));
    },
    async cancel() {
      await iterator.return?.();
    }
  });
}
