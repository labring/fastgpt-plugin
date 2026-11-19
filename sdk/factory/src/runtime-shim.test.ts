import { describe, expect, it, vi } from 'vitest';
import z from 'zod';

import { CoworkerdIngressInvoker } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/ingress-invoker';

import { HttpInvokeClient } from './http-invoke.client';
import { createToolHandler, defineTool, defineToolSet } from './index';
import { createWorkerRuntime, generateWorkerEntry } from './runtime-shim';

const manifest = {
  pluginId: 'worker-test',
  version: '1.0.0',
  name: { en: 'Test', 'zh-CN': '测试' },
  description: { en: 'Test', 'zh-CN': '测试' },
  versionDescription: { en: 'Test', 'zh-CN': '测试' },
  tags: ['tools'] as ['tools']
};
const options = { invokeGatewayUrl: 'https://host.internal/invoke' };
const userInfo = { username: 'alice', orgs: [], groups: [] };

function request(input: unknown = {}, stream = false, extra: Record<string, unknown> = {}) {
  return new Request('https://worker/system/test/run', {
    method: 'POST',
    headers: {
      Accept: stream ? 'application/x-ndjson' : 'application/json',
      'x-fastgpt-invoke-token': 'scoped-token',
      'x-fastgpt-invocation-id': 'invoke-1'
    },
    body: JSON.stringify({ payload: { input, systemVar: {}, ...extra } })
  });
}

function fixture() {
  return defineTool({
    manifest,
    handler: createToolHandler({
      inputSchema: z.object({ name: z.string().trim() }),
      outputSchema: z.object({ greeting: z.string() }),
      secretSchema: z.object({ prefix: z.string() }),
      handler: async (input, ctx) => {
        ctx.streamResponse({ type: 'answer', content: input.name });
        return { greeting: `${ctx.secrets?.prefix} ${input.name}` };
      }
    })
  });
}

describe('Worker runtime shim', () => {
  it('runs a real SDK factory with input, secret and output schema transformations', async () => {
    const runtime = createWorkerRuntime(fixture(), options);
    const response = await runtime.fetch(request({ name: '  Alice  ' }, false, { secrets: { prefix: 'Hi' } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ greeting: 'Hi Alice' });
  });

  it('round-trips streaming messages through the ingress invoker before the handler completes', async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => { finish = resolve; });
    const tool = defineTool({
      manifest,
      handler: createToolHandler({
        inputSchema: z.object({}),
        outputSchema: z.object({ ok: z.boolean() }),
        handler: async (_, ctx) => {
          ctx.streamResponse({ type: 'answer', content: 'first' });
          await gate;
          return { ok: true };
        }
      })
    });
    const runtime = createWorkerRuntime(tool, options);
    const invoker = new CoworkerdIngressInvoker({
      ingressUrl: 'https://worker',
      requestTimeoutMs: 1000,
      fetch: async (url, init) => runtime.fetch(new Request(String(url), init))
    });
    const [stream, error] = await invoker.invoke<unknown, true>({
      tenantId: 'system', workerId: 'test', eventName: 'run',
      payload: { input: {}, systemVar: {} }, returnStream: true
    });
    expect(error).toBeNull();
    const messages: unknown[] = [];
    await stream!.consume((message) => { messages.push(message); finish(); });
    expect(messages).toEqual([
      { type: 'stream', data: { type: 'answer', content: 'first' } },
      { type: 'response', data: { ok: true } }
    ]);
  });

  it('selects a toolset child', async () => {
    const tool = defineToolSet({
      manifest,
      children: [{
        id: 'child', name: manifest.name, description: manifest.description,
        handler: createToolHandler({
          inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean() }),
          handler: async () => ({ ok: true })
        })
      }]
    });
    const runtime = createWorkerRuntime(tool, options);
    expect(await (await runtime.fetch(request({}, false, { childId: 'child' }))).json()).toEqual({ ok: true });
    expect((await runtime.fetch(request({}, false, { childId: 'missing' }))).status).toBe(404);
  });

  it.each([false, true])('reports validation errors without exposing secrets (stream=%s)', async (stream) => {
    const runtime = createWorkerRuntime(fixture(), options);
    const response = await runtime.fetch(request({ name: 123 }, stream, { secrets: { prefix: 'SECRET' } }));
    const text = await response.text();
    expect(text).not.toContain('SECRET');
    expect(text).not.toContain('greeting');
    if (stream) {
      expect(text.trim().split('\n').map((line) => JSON.parse(line))).toEqual([
        { event: 'chunk', data: { type: 'error', data: 'Tool execution failed' } },
        { event: 'end' }
      ]);
    } else expect(response.status).toBe(500);
  });

  it('rejects invalid HTTP requests before calling a handler', async () => {
    const runtime = createWorkerRuntime(fixture(), options);
    expect((await runtime.fetch(new Request('https://worker/run'))).status).toBe(405);
    expect((await runtime.fetch(new Request('https://worker/other', { method: 'POST' }))).status).toBe(404);
    expect((await runtime.fetch(new Request('https://worker/run', { method: 'POST', body: 'bad json' }))).status).toBe(400);
    expect((await runtime.fetch(request(null))).status).toBe(400);
  });

  it('keeps concurrent reverse-invoke tokens separate and expires clients after execution', async () => {
    const hostFetch = vi.fn<typeof fetch>(async (_url, init) => {
      await Promise.resolve();
      return Response.json([{ ...userInfo, username: new Headers(init?.headers).get('Authorization') }, null]);
    });
    const clients: HttpInvokeClient[] = [];
    const tool = defineTool({
      manifest,
      handler: createToolHandler({
        inputSchema: z.object({}), outputSchema: z.object({ username: z.string() }),
        handler: async (_, ctx) => {
          clients.push(ctx.invoke as HttpInvokeClient);
          const [user, error] = await ctx.invoke.userInfo();
          if (error) throw error.error;
          return { username: user.username };
        }
      })
    });
    const runtime = createWorkerRuntime(tool, { ...options, fetch: hostFetch });
    const a = request();
    const b = request();
    a.headers.set('x-fastgpt-invoke-token', 'A');
    b.headers.set('x-fastgpt-invoke-token', 'B');
    const results = await Promise.all([runtime.fetch(a), runtime.fetch(b)]);
    expect(await Promise.all(results.map((response) => response.json()))).toEqual([
      { username: 'Bearer A' }, { username: 'Bearer B' }
    ]);
    for (const [, init] of hostFetch.mock.calls) expect(init?.signal?.aborted).toBe(true);
    expect(clients).toHaveLength(2);
    expect((await clients[0].userInfo())[1]).not.toBeNull();
    expect(hostFetch).toHaveBeenCalledTimes(2);
  });

  it('uses the logical plugin ID for reverse scope when the physical Worker is version-addressed', async () => {
    const hostFetch = vi.fn<typeof fetch>(async () => Response.json([userInfo, null]));
    const tool = defineTool({ manifest, handler: createToolHandler({
      inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean() }),
      handler: async (_, ctx) => { await ctx.invoke.userInfo(); return { ok: true }; }
    }) });
    const req = new Request('https://worker/system/fg-immutablehash/run', {
      method: 'POST', headers: { 'x-fastgpt-plugin-id': encodeURIComponent('Logical_Plugin'), 'x-fastgpt-invoke-token': 'scoped', 'x-fastgpt-invocation-id': 'i' },
      body: JSON.stringify({ payload: { input: {}, systemVar: {} } })
    });
    expect((await createWorkerRuntime(tool, { ...options, fetch: hostFetch }).fetch(req)).status).toBe(200);
    expect(new Headers(hostFetch.mock.calls[0][1]?.headers).get('x-fastgpt-plugin-id')).toBe('Logical_Plugin');
    expect(new Headers(hostFetch.mock.calls[0][1]?.headers).get('x-fastgpt-tenant-id')).toBe('system');
  });

  it('cancels pending reverse calls when the output consumer disconnects', async () => {
    let started!: () => void;
    const hostStarted = new Promise<void>((resolve) => { started = resolve; });
    let hostSignal: AbortSignal | null | undefined;
    const hostFetch: typeof fetch = async (_url, init) => {
      hostSignal = init?.signal;
      started();
      return new Promise((_resolve, reject) => {
        hostSignal?.addEventListener('abort', () => reject(hostSignal?.reason), { once: true });
      });
    };
    const tool = defineTool({
      manifest,
      handler: createToolHandler({
        inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean() }),
        handler: async (_, ctx) => {
          await ctx.invoke.userInfo();
          return { ok: true };
        }
      })
    });
    const runtime = createWorkerRuntime(tool, { ...options, fetch: hostFetch });
    const response = await runtime.fetch(request({}, true));
    await hostStarted;
    await response.body!.cancel();
    expect(hostSignal?.aborted).toBe(true);
  });

  it('fails the response stream promptly on request abort even if a handler is still waiting', async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => { finish = resolve; });
    const tool = defineTool({
      manifest,
      handler: createToolHandler({
        inputSchema: z.object({}), outputSchema: z.object({ ok: z.boolean() }),
        handler: async () => { await gate; return { ok: true }; }
      })
    });
    const cancellation = new AbortController();
    const req = new Request(request({}, true), { signal: cancellation.signal });
    const response = await createWorkerRuntime(tool, options).fetch(req);
    const result = response.text();
    cancellation.abort(new Error('caller cancelled'));
    try {
      await expect(result).rejects.toThrow('caller cancelled');
    } finally {
      finish();
    }
  });

  it('generates a default-exported Worker entry with safely quoted module paths', () => {
    const entry = generateWorkerEntry('./plugin".mjs', options);
    expect(entry).toContain('import plugin from "./plugin\\".mjs"');
    expect(entry).toContain('export default createWorkerRuntime(plugin,');
    expect(entry).toContain('@fastgpt-plugin/sdk-factory/runtime-shim');
  });
});

describe('HTTP reverse-invoke client', () => {
  it('uploads byte arrays and streams without Node imports', async () => {
    const bodies: number[][] = [];
    const mockFetch: typeof fetch = async (_url, init) => {
      bodies.push([...new Uint8Array(await new Response(init?.body).arrayBuffer())]);
      expect(new Headers(init?.headers).get('x-fastgpt-file-name')).toBe(encodeURIComponent('文件.txt'));
      return Response.json([{ accessURL: 'https://files/test' }, null]);
    };
    const client = new HttpInvokeClient({
      ...options, gatewayUrl: options.invokeGatewayUrl,
      token: 't', tenantId: 'system', pluginId: 'test', invocationId: 'invoke-1', signal: new AbortController().signal, fetch: mockFetch
    });
    expect((await client.uploadFile({ file: Buffer.from([1, 2]), fileName: '文件.txt' }))[1]).toBeNull();
    const { Readable } = await import('node:stream');
    expect((await client.uploadFile({ file: Readable.from([Buffer.from([3, 4])]), fileName: '文件.txt' }))[1]).toBeNull();
    expect(bodies).toEqual([[1, 2], [3, 4]]);
  });

  it('uses workerd-compatible manual redirects and refuses to follow them with credentials', async () => {
    const hostFetch = vi.fn<typeof fetch>(async (_url, init) => {
      if (init?.redirect === 'error') throw new TypeError('workerd does not implement redirect: error');
      expect(init?.redirect).toBe('manual');
      return new Response(null, { status: 302, headers: { Location: 'https://untrusted.invalid' } });
    });
    const client = new HttpInvokeClient({
      gatewayUrl: options.invokeGatewayUrl, token: 'scoped', tenantId: 'system', pluginId: 'test', invocationId: 'i',
      signal: new AbortController().signal, fetch: hostFetch
    });
    expect((await client.userInfo())[1]).not.toBeNull();
    expect(hostFetch).toHaveBeenCalledTimes(1);
    expect(hostFetch.mock.calls[0][1]?.redirect).toBe('manual');
  });

  it.each([
    () => new Response('denied', { status: 403 }),
    () => Response.json({ unexpected: true }),
    () => Response.json([null, { code: 'DENIED', message: 'sensitive' }])
  ])('returns Result failures for rejected or malformed host responses', async (response) => {
    const client = new HttpInvokeClient({
      gatewayUrl: options.invokeGatewayUrl, token: 't', tenantId: 'system', pluginId: 'test', invocationId: 'invoke-1',
      signal: new AbortController().signal, fetch: async () => response()
    });
    const [result, error] = await client.userInfo();
    expect(result).toBeNull();
    expect(error?.reason.en).toBe('Host reverse invocation failed');
  });
});
