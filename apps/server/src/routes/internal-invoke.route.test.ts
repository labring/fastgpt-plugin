import { serve, type ServerType } from '@hono/node-server';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

import type { InvokePort } from '@domain/ports/invoke.port';
import { successResult } from '@domain/value-objects/result.vo';
import { createBearerHonoAuthMiddleware } from '@infrastructure/hono/middleware/auth';
import { InternalPluginInvokeTokenService } from '@infrastructure/plugin/invoke/internal-invoke-token.service';

import { HttpInvokeClient } from '../../../../sdk/factory/src/http-invoke.client';
import { createWorkerRuntime } from '../../../../sdk/factory/src/runtime-shim';
import { createToolHandler, defineTool } from '../../../../sdk/factory/src/worker';

import { makeInternalInvokeRoute } from './internal-invoke.route';

const secret = 'test-only-internal-invoke-secret-32-characters';
const identity = { tenantId: 'system', pluginId: 'test', invocationId: 'invoke-1' };
const context = { ...identity, invokeToken: 'private-upstream-token' };
const user = { username: 'alice', orgs: [], groups: [] };
const service = new InternalPluginInvokeTokenService(secret);

function headers(token = service.issue(context)) {
  return {
    Authorization: `Bearer ${token}`,
    'x-fastgpt-tenant-id': identity.tenantId,
    'x-fastgpt-plugin-id': identity.pluginId,
    'x-fastgpt-invocation-id': identity.invocationId
  };
}

function fixture() {
  const host = {
    userInfo: vi.fn<InvokePort['userInfo']>().mockResolvedValue(successResult(user)),
    uploadFile: vi.fn<InvokePort['uploadFile']>().mockResolvedValue(successResult({ accessURL: 'https://files/test' })),
    getWecomCorpToken: vi.fn<InvokePort['getWecomCorpToken']>().mockResolvedValue(successResult({ access_token: 'wecom', expires_in: 7200 }))
  };
  const factory = vi.fn((_token: string, _signal: AbortSignal): InvokePort => host);
  const route = makeInternalInvokeRoute({ tokenService: service, fastgptBaseUrl: 'https://fastgpt.invalid', maxUploadBytes: 4, invokeManagerFactory: factory });
  const post = (method: string, init: RequestInit = {}) => route.request(`/v1/${method}`, { method: 'POST', headers: headers(), ...init });
  return { host, factory, route, post };
}

const servers: ServerType[] = [];
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    if ('closeAllConnections' in server) server.closeAllConnections();
  })));
});

async function listen(app: Hono): Promise<string> {
  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 }, (info) => resolve(`http://127.0.0.1:${info.port}`));
    servers.push(server);
  });
}

describe('internal invoke route', () => {
  it('keeps scoped invocation credentials separate from management authentication', async () => {
    const { route, factory } = fixture();
    const app = new Hono();
    app.use('/api/*', createBearerHonoAuthMiddleware('management-token'));
    app.get('/api/protected', (c) => c.json({ ok: true }));
    app.route('/internal/plugin-invoke', route);
    expect((await app.request('/api/protected', { headers: headers() })).status).toBe(401);
    expect((await app.request('/api/protected', { headers: { Authorization: 'Bearer management-token' } })).status).toBe(200);
    expect((await app.request('/internal/plugin-invoke/v1/userInfo', { method: 'POST', headers: { ...headers(), Authorization: 'Bearer management-token' } })).status).toBe(401);
    expect(factory).not.toHaveBeenCalled();
    expect((await app.request('/internal/plugin-invoke/v1/userInfo', { method: 'POST', headers: headers() })).status).toBe(200);
  });

  it('dispatches only the three allowed host capabilities and returns Result tuples', async () => {
    const { post, host, factory } = fixture();
    expect(await (await post('userInfo')).json()).toEqual([user, null]);
    expect(await (await post('wecomCorpToken')).json()).toEqual([{ access_token: 'wecom', expires_in: 7200 }, null]);
    const upload = await post('uploadFile', { headers: { ...headers(), 'Content-Type': 'text/plain', 'x-fastgpt-file-name': encodeURIComponent('文件.txt') }, body: '1234' });
    expect(upload.status).toBe(200);
    expect(upload.headers.get('Cache-Control')).toBe('no-store');
    expect(host.uploadFile).toHaveBeenCalledWith({ file: Buffer.from('1234'), fileName: '文件.txt', contentType: 'text/plain' });
    expect(factory).toHaveBeenCalledWith(context.invokeToken, expect.any(AbortSignal));
    expect((await post('deleteTenant')).status).toBe(404);
  });

  it.each(['missing', 'tampered', 'expired', 'future', 'missing identity'])('rejects %s credentials before dispatch', async (kind) => {
    const { post, factory } = fixture();
    const auth = headers();
    if (kind === 'missing') auth.Authorization = '';
    if (kind === 'tampered') auth.Authorization += 'x';
    if (kind === 'expired') auth.Authorization = `Bearer ${service.issue(context, Date.now() - 30_000)}`;
    if (kind === 'future') auth.Authorization = `Bearer ${service.issue(context, Date.now() + 10_000)}`;
    if (kind === 'missing identity') auth['x-fastgpt-invocation-id'] = '';
    expect((await post('userInfo', { headers: auth })).status).toBe(401);
    expect(factory).not.toHaveBeenCalled();
  });

  it.each(['x-fastgpt-tenant-id', 'x-fastgpt-plugin-id', 'x-fastgpt-invocation-id'])('rejects a mismatched %s', async (key) => {
    const { post, factory } = fixture();
    expect((await post('userInfo', { headers: { ...headers(), [key]: 'another' } })).status).toBe(403);
    expect(factory).not.toHaveBeenCalled();
  });

  it.each(['declared', 'streamed'])('bounds %s uploads before forwarding them', async (kind) => {
    const { post, host } = fixture();
    const body = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(5)); c.close(); } });
    const response = await post('uploadFile', { headers: { ...headers(), ...(kind === 'declared' ? { 'Content-Length': '5' } : {}) }, body, duplex: 'half' } as RequestInit);
    expect(response.status).toBe(413);
    expect(host.uploadFile).not.toHaveBeenCalled();
  });

  it.each(['%zz', '../file', 'a%00b', 'a'.repeat(256)])('rejects invalid upload names', async (name) => {
    const { post, host } = fixture();
    expect((await post('uploadFile', { headers: { ...headers(), 'x-fastgpt-file-name': name }, body: 'x' })).status).toBe(400);
    expect(host.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects unsupported content types', async () => {
    const { post, host } = fixture();
    expect((await post('uploadFile', { headers: { ...headers(), 'Content-Type': 'custom/invalid' }, body: 'x' })).status).toBe(400);
    expect(host.uploadFile).not.toHaveBeenCalled();
  });

  it('does not expose upstream exceptions or malformed upstream responses', async () => {
    const { post, host } = fixture();
    host.userInfo.mockRejectedValueOnce(new Error('private-upstream-token'));
    const response = await post('userInfo');
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(context.invokeToken);
    host.userInfo.mockResolvedValueOnce(successResult(null as never));
    expect((await post('userInfo')).status).toBe(502);
  });

  it('aborts upstream requests at credential expiration', async () => {
    const shortService = new InternalPluginInvokeTokenService(secret, 100);
    const factory = vi.fn((_token: string, signal: AbortSignal): InvokePort => ({
      ...fixture().host,
      userInfo: () => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      })
    }));
    const route = makeInternalInvokeRoute({ tokenService: shortService, fastgptBaseUrl: 'https://unused.invalid', maxUploadBytes: 4, invokeManagerFactory: factory });
    const response = await route.request('/v1/userInfo', { method: 'POST', headers: headers(shortService.issue(context)) });
    expect(response.status).toBe(502);
    expect(factory.mock.calls[0][1].aborted).toBe(true);
  });

  it('stops a stalled upload when its credential expires without dispatching upstream', async () => {
    const shortService = new InternalPluginInvokeTokenService(secret, 100);
    const factory = vi.fn(() => fixture().host);
    const route = makeInternalInvokeRoute({ tokenService: shortService, fastgptBaseUrl: 'https://unused.invalid', maxUploadBytes: 4, invokeManagerFactory: factory });
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    const response = await route.request('/v1/uploadFile', {
      method: 'POST', headers: headers(shortService.issue(context)), body, duplex: 'half'
    } as RequestInit);
    expect(response.status).toBe(401);
    expect(cancel).toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });

  it('does not forward an already aborted caller', async () => {
    const { post, factory } = fixture();
    await post('userInfo', { signal: AbortSignal.abort() });
    expect(factory).not.toHaveBeenCalled();
  });

  it('round-trips Worker shim -> HTTP gateway -> FastGPT HTTP API with isolated credentials', async () => {
    const upstream = new Hono();
    const observed: string[] = [];
    upstream.get('/api/invoke/userInfo', (c) => {
      observed.push(c.req.header('Authorization') ?? '');
      return c.json({ data: { ...user, username: c.req.header('Authorization') } });
    });
    upstream.get('/api/proApi/support/wecom/getCorpToken', (c) => c.json({ data: { access_token: 'corp', expires_in: 60 } }));
    upstream.post('/api/invoke/fileUpload', async (c) => {
      const form = await c.req.raw.formData();
      const file = form.get('file');
      expect(file).toBeInstanceOf(File);
      expect(await (file as File).text()).toBe('hello');
      expect(form.get('fileName')).toBe('文件.txt');
      return c.json({ data: { url: 'https://files/upload' } });
    });
    const upstreamUrl = await listen(upstream);
    const gateway = new Hono().route('/internal/plugin-invoke', makeInternalInvokeRoute({ tokenService: service, fastgptBaseUrl: upstreamUrl, maxUploadBytes: 1024 }));
    const gatewayUrl = `${await listen(gateway)}/internal/plugin-invoke/v1`;
    const worker = createWorkerRuntime(defineTool({
      manifest: { pluginId: 'test', version: '1.0.0', name: { en: 'Test', 'zh-CN': '测试' }, description: { en: 'Test', 'zh-CN': '测试' }, versionDescription: { en: 'Test', 'zh-CN': '测试' }, tags: ['tools'] },
      handler: createToolHandler({
        inputSchema: z.object({}), outputSchema: z.object({ username: z.string() }),
        handler: async (_, ctx) => {
          const [result, error] = await ctx.invoke.userInfo();
          if (error) throw error.error;
          return { username: result.username };
        }
      })
    }), { invokeGatewayUrl: gatewayUrl });
    const responses = await Promise.all(['A', 'B'].map((invokeToken) => worker.fetch(new Request('http://worker/system/test/run', {
      method: 'POST', headers: { 'x-fastgpt-invoke-token': service.issue({ ...context, invokeToken }), 'x-fastgpt-invocation-id': identity.invocationId },
      body: JSON.stringify({ payload: { input: {}, systemVar: {} } })
    }))));
    expect(await Promise.all(responses.map((r) => r.json()))).toEqual([{ username: 'Bearer A' }, { username: 'Bearer B' }]);
    expect(observed.sort()).toEqual(['Bearer A', 'Bearer B']);
    const client = new HttpInvokeClient({ ...identity, gatewayUrl, token: service.issue(context), signal: new AbortController().signal });
    expect(await client.getWecomCorpToken()).toEqual([{ access_token: 'corp', expires_in: 60 }, null]);
    expect(await client.uploadFile({ file: Buffer.from('hello'), fileName: '文件.txt', contentType: 'text/plain' })).toEqual([{ accessURL: 'https://files/upload' }, null]);
  });
});
