import { InvokeMethodEnum, type InvokeUploadFileInputType } from '@domain/ports/invoke.port';
import { StreamData } from '@domain/value-objects/stream.vo';
import { InvokeManager } from '@infrastructure/plugin/invoke/invoke.impl';

import type { LocalDebugHostRequestContext, LocalDebugRuntime } from './runtime';

type RemoteInvokeSession = {
  invokeToken: string;
};

export class RemoteDebugInvokeBridge {
  private readonly sessions = new Map<string, RemoteInvokeSession>();
  private readonly getFastgptBaseUrl: () => string;

  constructor(fastgptBaseUrl: string | (() => string)) {
    this.getFastgptBaseUrl =
      typeof fastgptBaseUrl === 'function' ? fastgptBaseUrl : () => fastgptBaseUrl;
  }

  attach(runtime: LocalDebugRuntime): void {
    runtime.setHostRequestHandler((request) => this.handleHostRequest(request));
  }

  bind(traceId: string, input: { invokeToken: string }): void {
    this.sessions.set(traceId, {
      invokeToken: input.invokeToken
    });
  }

  release(traceId: string): void {
    this.sessions.delete(traceId);
  }

  private async handleHostRequest({
    method,
    args,
    input,
    traceId
  }: LocalDebugHostRequestContext): Promise<unknown> {
    if (!traceId) {
      throw new Error('远程调试反向调用缺少 traceId。');
    }

    const session = this.sessions.get(traceId);
    if (!session) {
      throw new Error('远程调试反向调用会话不存在或已结束。');
    }

    const invoke = new InvokeManager({
      token: session.invokeToken,
      fastgptBaseUrl: this.getFastgptBaseUrl()
    });

    switch (method) {
      case InvokeMethodEnum.uploadFile:
        return invoke.uploadFile({
          ...(ensurePlainObject(args) as Omit<InvokeUploadFileInputType, 'file'>),
          file: input ? await readSourceToBuffer(input) : Buffer.alloc(0)
        });
      case InvokeMethodEnum.userInfo:
        return invoke.userInfo();
      case InvokeMethodEnum.wecomCorpToken:
        return invoke.getWecomCorpToken();
      default:
        throw new Error(`远程调试宿主暂不支持反向调用: ${String(method)}`);
    }
  }
}

function ensurePlainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function readSourceToBuffer(
  source: StreamData<unknown> | AsyncIterable<unknown>
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const iterable = isStreamDataLike(source) ? source.values() : source;

  for await (const chunk of iterable) {
    chunks.push(toBuffer(chunk));
  }

  return Buffer.concat(chunks);
}

function isStreamDataLike(source: StreamData<unknown> | AsyncIterable<unknown>): source is StreamData<unknown> {
  return (
    source instanceof StreamData ||
    (typeof source === 'object' &&
      source !== null &&
      typeof (source as { values?: unknown }).values === 'function' &&
      typeof (source as { consume?: unknown }).consume === 'function')
  );
}

function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  if (typeof value === 'string') {
    return Buffer.from(value);
  }
  return Buffer.from(JSON.stringify(value));
}
