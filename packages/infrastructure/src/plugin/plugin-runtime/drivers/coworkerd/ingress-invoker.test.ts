import { describe, expect, it, vi } from 'vitest';

import { StreamData } from '@domain/value-objects/stream.vo';

import {
  COWORKERD_INVOCATION_ID_HEADER,
  COWORKERD_INVOKE_TOKEN_HEADER,
  CoworkerdIngressInvoker
} from './ingress-invoker';

const ingressUrl = 'http://ingress.local:8930/';

function ndjsonResponse(frames: unknown[], chunkSize?: number): Response {
  const text = frames.map((f) => JSON.stringify(f)).join('\n') + '\n';
  const bytes = new TextEncoder().encode(text);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const size = chunkSize ?? bytes.length;
      for (let i = 0; i < bytes.length; i += size) {
        controller.enqueue(bytes.slice(i, i + size));
      }
      controller.close();
    }
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'application/x-ndjson' } });
}

async function collect<R>(stream: StreamData<R>): Promise<R[]> {
  const out: R[] = [];
  for await (const chunk of stream.values()) out.push(chunk);
  return out;
}

const make = (mockFetch: unknown, requestTimeoutMs = 5000) =>
  new CoworkerdIngressInvoker({ ingressUrl, requestTimeoutMs, fetch: mockFetch as typeof fetch });

describe('CoworkerdIngressInvoker', () => {
  it('posts payload, config, token and invocation id to tenant/worker/event', async () => {
    const mockFetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));

    const [data, err] = await make(mockFetch).invoke({
      tenantId: 'system',
      workerId: 'weather',
      eventName: 'run',
      payload: { city: 'SH' },
      returnStream: false,
      invokeToken: 'tok',
      config: { apiKey: 'k' },
      invocationId: 'inv-1'
    });

    expect(err).toBeNull();
    expect(data).toEqual({ ok: true });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://ingress.local:8930/system/weather/run');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      payload: { city: 'SH' },
      config: { apiKey: 'k' }
    });
    const headers = init.headers as Headers;
    expect(headers.get(COWORKERD_INVOKE_TOKEN_HEADER)).toBe('tok');
    expect(headers.get(COWORKERD_INVOCATION_ID_HEADER)).toBe('inv-1');
  });

  it('strips the upstream credential without mutating the host payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const payload = { input: {}, systemVar: { invokeToken: 'private-upstream', time: 'now' } };
    await make(mockFetch).invoke({ tenantId: 'system', workerId: 'test', eventName: 'run', payload, returnStream: false, invokeToken: 'scoped' });
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string).payload.systemVar).toEqual({ invokeToken: '', time: 'now' });
    expect(init.redirect).toBe('error');
    expect(payload.systemVar.invokeToken).toBe('private-upstream');
  });

  it('maps an ndjson response to StreamData, including frames split across reads', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      ndjsonResponse(
        [
          { event: 'chunk', data: { n: 1 } },
          { event: 'chunk', data: { n: 2 } },
          { event: 'end' }
        ],
        7
      )
    );

    const [stream, err] = await make(mockFetch).invoke<{ n: number }, true>({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: true
    });

    expect(err).toBeNull();
    expect(await collect(stream!)).toEqual([{ n: 1 }, { n: 2 }]);
  });

  it('fails the stream when the worker sends an error frame', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      ndjsonResponse([{ event: 'chunk', data: 1 }, { event: 'error', message: 'boom' }])
    );

    const [stream] = await make(mockFetch).invoke<number, true>({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: true
    });

    await expect(collect(stream!)).rejects.toThrow();
  });

  it('fails the stream when it ends without an end frame', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(ndjsonResponse([{ event: 'chunk', data: 1 }]));

    const [stream] = await make(mockFetch).invoke<number, true>({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: true
    });

    await expect(collect(stream!)).rejects.toThrow();
  });

  it('forwards coworkerd platform code and status in error data on non-2xx', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      Response.json({ code: 'CPU_LIMIT_EXCEEDED', reason: 'cpu limit' }, { status: 503 })
    );

    const [, err] = await make(mockFetch).invoke({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe('plugin.invoke.cpu_limit_exceeded');
    expect(err?.data).toEqual({ status: 503, code: 'CPU_LIMIT_EXCEEDED', reason: 'cpu limit' });
  });

  it('maps MEMORY_LIMIT_EXCEEDED to plugin.invoke.memory_limit_exceeded', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      Response.json({ code: 'MEMORY_LIMIT_EXCEEDED', reason: 'memory limit' }, { status: 503 })
    );

    const [, err] = await make(mockFetch).invoke({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe('plugin.invoke.memory_limit_exceeded');
    expect(err?.data).toEqual({ status: 503, code: 'MEMORY_LIMIT_EXCEEDED', reason: 'memory limit' });
  });

  it('returns a timeout error when the deadline passes', async () => {
    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
    );

    const [, err] = await make(mockFetch).invoke({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: false,
      timeoutMs: 20
    });

    expect(err?.code).toBe('plugin.invoke.timeout');
  });

  it('aborts when the caller signal fires, without reporting a timeout', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
    );

    const pending = make(mockFetch).invoke({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: false,
      signal: controller.signal
    });
    controller.abort(new Error('cancelled'));
    const [, err] = await pending;

    expect(err?.code).toBe('plugin.invoke.failed');
  });

  it('returns a failure on network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const [, err] = await make(mockFetch).invoke({
      tenantId: 't',
      workerId: 'w',
      eventName: 'run',
      payload: {},
      returnStream: false
    });

    expect(err?.code).toBe('plugin.runtime.cluster_unavailable');
  });
});
