import {
  type InvokeChatCompletionReplyMetaType,
  InvokeMethodEnum,
  type InvokeUploadFileInputType,
  parseInvokeChatCompletionInput
} from '@domain/ports/invoke.port';
import { successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { InvokeManager } from '@infrastructure/plugin/invoke/invoke.impl';

import type { LocalDebugHostRequestContext, LocalDebugRuntime } from './runtime';

type RemoteInvokeSession = {
  invokeToken: string;
  controllers: Set<AbortController>;
};

export class RemoteDebugInvokeBridge {
  private readonly sessions = new Map<string, RemoteInvokeSession>();
  private readonly getFastgptBaseUrl: () => string;
  private detachChannelClose: (() => void) | null = null;

  constructor(fastgptBaseUrl: string | (() => string)) {
    this.getFastgptBaseUrl =
      typeof fastgptBaseUrl === 'function' ? fastgptBaseUrl : () => fastgptBaseUrl;
  }

  attach(runtime: LocalDebugRuntime): void {
    this.detachChannelClose?.();
    this.detachChannelClose = runtime.hostChannel.onClose(() => {
      this.abortAll();
    });
    runtime.setHostRequestHandler((request) => this.handleHostRequest(request));
  }

  bind(traceId: string, input: { invokeToken: string }): void {
    this.release(traceId);
    this.sessions.set(traceId, {
      invokeToken: input.invokeToken,
      controllers: new Set()
    });
  }

  release(traceId: string): void {
    const session = this.sessions.get(traceId);
    if (!session) {
      return;
    }

    this.sessions.delete(traceId);
    for (const controller of session.controllers) {
      controller.abort();
    }
    session.controllers.clear();
  }

  abortAll(): void {
    for (const traceId of Array.from(this.sessions.keys())) {
      this.release(traceId);
    }
  }

  private async handleHostRequest({
    method,
    args,
    input,
    traceId,
    createReply
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
      case InvokeMethodEnum.chatCompletion: {
        const [chatInput, inputErr] = parseInvokeChatCompletionInput(args);
        if (inputErr) {
          return [null, inputErr];
        }

        const abortController = new AbortController();
        session.controllers.add(abortController);
        let streamTransferred = false;

        try {
          const invokeResult = await invoke.chatCompletion(chatInput, {
            signal: abortController.signal
          });
          const [response, responseErr] = invokeResult;
          if (responseErr || !response.stream) {
            return invokeResult;
          }

          const reply = createReply(
            successResult<InvokeChatCompletionReplyMetaType>({
              status: response.status,
              headers: response.headers
            }),
            {
              output: response.stream
            }
          );
          streamTransferred = true;
          attachStreamAbortCleanup(response.stream, abortController, () => {
            session.controllers.delete(abortController);
          });
          return reply;
        } catch (error) {
          abortController.abort();
          throw error;
        } finally {
          if (!streamTransferred) {
            session.controllers.delete(abortController);
          }
        }
      }
      default:
        throw new Error(`远程调试宿主暂不支持反向调用: ${String(method)}`);
    }
  }
}

function attachStreamAbortCleanup(
  stream: unknown,
  abortController: AbortController,
  cleanup: () => void
): void {
  let cleaned = false;
  let completed = false;

  const finish = (shouldAbort: boolean) => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    cleanup();
    if (shouldAbort && !abortController.signal.aborted) {
      abortController.abort();
    }
  };

  if (stream instanceof StreamData) {
    stream
      .onEnd(() => {
        completed = true;
        finish(false);
      })
      .onError(() => {
        finish(true);
      });
    stream.toReadable().once('close', () => {
      finish(!completed);
    });
    return;
  }

  if (stream && typeof stream === 'object' && 'once' in stream && typeof stream.once === 'function') {
    const emitter = stream as NodeJS.EventEmitter;
    emitter.once('end', () => {
      completed = true;
      finish(false);
    });
    emitter.once('error', () => {
      finish(true);
    });
    emitter.once('close', () => {
      finish(!completed);
    });
    return;
  }

  finish(false);
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
