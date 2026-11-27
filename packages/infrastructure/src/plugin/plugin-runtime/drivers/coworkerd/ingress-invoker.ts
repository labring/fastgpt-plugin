import { createError } from '@domain/value-objects/error.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { isClusterTransportFailure, mapCoworkerdHttpError } from './error-handler';

export type CoworkerdIngressInvokerDeps = {
  ingressUrl: string;
  requestTimeoutMs: number;
  fetch?: typeof fetch;
};

export type CoworkerdIngressInvokeArg<P = unknown, S extends boolean = boolean> = {
  tenantId: string;
  workerId: string;
  /** Logical SDK plugin ID; the physical Worker ID may include an immutable deployment hash. */
  pluginId?: string;
  eventName: string;
  payload: P;
  returnStream: S;
  /** Short-lived token the plugin uses to call back the host. */
  invokeToken?: string;
  /** Per-invocation business config and secrets, injected so the Worker stays stateless. */
  config?: Record<string, unknown>;
  invocationId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Host lifecycle hook: fires when the transport settles, even before buffered output is consumed. */
  onStreamComplete?: () => void;
};

/**
 * Wire protocol between the host and the runtime shim when `returnStream` is true:
 * newline-delimited JSON frames.
 */
type StreamFrame =
  | { event: 'chunk'; data: unknown }
  | { event: 'error'; message: string; code?: string }
  | { event: 'end' };

export const COWORKERD_INVOKE_TOKEN_HEADER = 'x-fastgpt-invoke-token';
export const COWORKERD_INVOCATION_ID_HEADER = 'x-fastgpt-invocation-id';

/**
 * Data-plane client: POSTs to `<ingress>/<tenant>/<worker>/<eventName>` and maps the
 * response back to `Result` / `StreamData`.
 */
export class CoworkerdIngressInvoker {
  private readonly baseUrl: string;
  private readonly customFetch: typeof fetch;

  constructor(private readonly deps: CoworkerdIngressInvokerDeps) {
    this.baseUrl = deps.ingressUrl.replace(/\/+$/, '');
    this.customFetch = deps.fetch ?? globalThis.fetch;
  }

  async invoke<R = unknown, S extends boolean = boolean, P = unknown>(
    arg: CoworkerdIngressInvokeArg<P, S>
  ): Promise<Result<S extends true ? StreamData<R> : R>> {
    type Out = S extends true ? StreamData<R> : R;

    const timeoutSignal = AbortSignal.timeout(arg.timeoutMs ?? this.deps.requestTimeoutMs);
    const signal = arg.signal ? AbortSignal.any([arg.signal, timeoutSignal]) : timeoutSignal;

    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: arg.returnStream ? 'application/x-ndjson' : 'application/json'
    });
    if (arg.pluginId) headers.set('x-fastgpt-plugin-id', encodeURIComponent(arg.pluginId));
    if (arg.invokeToken) headers.set(COWORKERD_INVOKE_TOKEN_HEADER, arg.invokeToken);
    if (arg.invocationId) headers.set(COWORKERD_INVOCATION_ID_HEADER, arg.invocationId);

    const url = `${this.baseUrl}/${encodeURIComponent(arg.tenantId)}/${encodeURIComponent(
      arg.workerId
    )}/${encodeURIComponent(arg.eventName)}`;

    let response: Response;
    try {
      response = await this.customFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ payload: workerPayload(arg.payload), config: arg.config ?? {} }),
        signal,
        redirect: 'error'
      });
    } catch (error) {
      return failureResult(this.toInvokeError(error, timeoutSignal));
    }

    if (!response.ok) {
      return failureResult(await mapCoworkerdHttpError(response));
    }

    if (!arg.returnStream) {
      try {
        return successResult((await response.json()) as Out);
      } catch (error) {
        return failureResult(this.toInvokeError(error, timeoutSignal));
      }
    }

    if (!response.body) {
      return failureResult(
        createError(ErrorCode.pluginInvokeFailed, { message: 'Empty stream response body' })
      );
    }

    const body = response.body;
    return successResult(
      StreamData.create<R>((stream) => {
        const cancellation = new AbortController();
        const abortTransport = () => cancellation.abort(signal.reason);
        signal.addEventListener('abort', abortTransport, { once: true });
        if (signal.aborted) abortTransport();
        stream.toReadable().once('close', () => cancellation.abort());
        void pipeNdjsonFrames(body, stream, cancellation.signal).catch((error) => {
          stream.fail(this.toInvokeError(error, timeoutSignal));
        }).finally(() => {
          signal.removeEventListener('abort', abortTransport);
          arg.onStreamComplete?.();
        });
      }) as Out
    );
  }

  private toInvokeError(error: unknown, timeoutSignal: AbortSignal): Error {
    if (timeoutSignal.aborted) {
      return createError(ErrorCode.pluginInvokeTimeout, { cause: error });
    }
    if (isClusterTransportFailure(error)) {
      return createError(ErrorCode.pluginRuntimeClusterUnavailable, {
        message: error instanceof Error ? error.message : 'Coworkerd cluster transport error',
        cause: error
      });
    }
    return createError(ErrorCode.pluginInvokeFailed, { cause: error });
  }
}

/** Preserve the SDK field shape without exposing the unrestricted upstream credential. */
function workerPayload(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.systemVar)) return payload;
  return { ...payload, systemVar: { ...payload.systemVar, invokeToken: '' } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function pipeNdjsonFrames<R>(
  body: ReadableStream<Uint8Array>,
  stream: StreamData<R>,
  signal: AbortSignal
): Promise<void> {
  const reader = body.getReader();
  const onAbort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', onAbort, { once: true });
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    const frame = JSON.parse(trimmed) as StreamFrame;
    if (frame.event === 'chunk') {
      stream.write(frame.data as R);
      return false;
    }
    if (frame.event === 'error') {
      throw new Error(frame.message);
    }
    return frame.event === 'end';
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (handleLine(line)) {
          stream.close();
          return;
        }
        newlineIndex = buffer.indexOf('\n');
      }

      if (done) break;
    }

    if (handleLine(buffer)) {
      stream.close();
      return;
    }
    // Stream ended without an `end` frame: treat as truncated rather than success.
    throw new Error('Coworkerd stream ended without an end frame');
  } finally {
    signal.removeEventListener('abort', onAbort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
