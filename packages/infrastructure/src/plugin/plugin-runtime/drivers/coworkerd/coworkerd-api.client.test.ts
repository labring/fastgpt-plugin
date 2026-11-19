import { describe, expect, it, vi } from 'vitest';

import { CoworkerdApiClient } from './coworkerd-api.client';

describe('CoworkerdApiClient', () => {
  const apiServerUrl = 'http://apiserver.local:8940';
  const managementToken = 'test-mgmt-token';

  it('getStatus returns status info on 200', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        apiserver: { version: '0.5.2' },
        caller: { scope: 'admin' }
      })
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [status, err] = await client.getStatus();

    expect(err).toBeNull();
    expect(status?.apiserver?.version).toBe('0.5.2');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/status',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers)
      })
    );
  });

  it('ensureTenant succeeds directly if tenant already exists', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ name: 'team-alpha', state: 'active' })
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [result, err] = await client.ensureTenant('team-alpha');

    expect(err).toBeNull();
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('ensureTenant creates tenant when getTenant returns 404', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'NOT_FOUND', reason: 'tenant not found' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ name: 'team-new', state: 'active' })
      });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [result, err] = await client.ensureTenant('team-new');

    expect(err).toBeNull();
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://apiserver.local:8940/v1/tenants',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'team-new' })
      })
    );
  });

  it('ensureTenant treats 409 conflict during create as success (concurrent creation)', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'NOT_FOUND', reason: 'tenant not found' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'CONFLICT', reason: 'tenant already exists' })
      });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [result, err] = await client.ensureTenant('team-concurrent');

    expect(err).toBeNull();
    expect(result).toBeUndefined();
  });

  it('ensureTenant propagates errors other than 404 or 409', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ code: 'FORBIDDEN', reason: 'insufficient permissions' })
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.ensureTenant('team-forbidden');

    expect(err).not.toBeNull();
    expect(err?.code).toBe('FORBIDDEN');
  });

  it('uploadVersion uploads bundle and activates version if activate is true', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        versionId: 'v1.0.0',
        active: true,
        record: { trial: { enabled: true } }
      })
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const dummyBundle = new Uint8Array([1, 2, 3, 4]);

    const [uploadRes, err] = await client.uploadVersion({
      tenantId: 'tenant-1',
      workerId: 'weather-tool',
      versionId: 'v1.0.0',
      bundle: dummyBundle,
      activate: true
    });

    expect(err).toBeNull();
    expect(uploadRes?.versionId).toBe('v1.0.0');
    expect(uploadRes?.active).toBe(true);
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/x-tar');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/tenants/tenant-1/workers/weather-tool/versions/v1.0.0?activate=true',
      expect.objectContaining({
        method: 'PUT',
        body: dummyBundle,
        headers: expect.any(Headers)
      })
    );
  });

  it('uploadVersion returns LOAD_FAILED failureResult when trial load fails with 422', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        code: 'LOAD_FAILED',
        reason: 'SyntaxError: unexpected token in worker main module'
      })
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.uploadVersion({
      tenantId: 'tenant-1',
      workerId: 'broken-tool',
      versionId: 'v1',
      bundle: new Uint8Array([0]),
      activate: true
    });

    expect(err).not.toBeNull();
    expect(err?.code).toBe('LOAD_FAILED');
    expect(err?.message).toContain('SyntaxError: unexpected token');
    expect(err?.reason.en).toContain('SyntaxError');
  });

  it('activateVersion calls POST :activate endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.activateVersion('t1', 'w1', 'v2');

    expect(err).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/tenants/t1/workers/w1/versions/v2:activate',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('deleteVersion removes an immutable version using its exact tenant/worker/version scope', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch });
    expect((await client.deleteVersion('tenant-1', 'worker-1', 'v-1'))[1]).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      `${apiServerUrl}/v1/tenants/tenant-1/workers/worker-1/versions/v-1`,
      expect.objectContaining({ method: 'DELETE', redirect: 'error' })
    );
  });

  it('deleteWorker calls DELETE endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => ''
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.deleteWorker('t1', 'w1');

    expect(err).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/tenants/t1/workers/w1',
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });

  it('setWorkerLimits sends PATCH with limits payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.setWorkerLimits('t1', 'w1', { cpuMs: 300, memoryMiB: 256 });

    expect(err).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/tenants/t1/workers/w1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ limits: { cpuMs: 300, memoryMiB: 256 } })
      })
    );
  });

  it('setWorkerRoutes sends PUT with routes payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({})
    });

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.setWorkerRoutes('t1', 'w1', [
      { host: '*', pathPrefix: '/t1/w1' }
    ]);

    expect(err).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://apiserver.local:8940/v1/tenants/t1/workers/w1/routes',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ routes: [{ host: '*', pathPrefix: '/t1/w1' }] })
      })
    );
  });

  it('gets Worker status with escaped identifiers and refuses management redirects', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ activeVersion: 'v1', valid: true }));
    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch });
    expect((await client.getWorker('tenant', 'worker'))[0]).toMatchObject({ activeVersion: 'v1', valid: true });
    expect(mockFetch.mock.calls[0][0]).toBe(`${apiServerUrl}/v1/tenants/tenant/workers/worker`);
    expect(mockFetch.mock.calls[0][1]?.redirect).toBe('error');
  });

  it('bounds control-plane requests with a timeout', async () => {
    const mockFetch: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    });
    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch, requestTimeoutMs: 10 });
    expect((await client.getStatus())[1]?.code).toBe('NETWORK_ERROR');
  });

  it('handles network failure gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const client = new CoworkerdApiClient({ apiServerUrl, managementToken, fetch: mockFetch as never });
    const [, err] = await client.getStatus();

    expect(err).not.toBeNull();
    expect(err?.code).toBe('NETWORK_ERROR');
    expect(err?.message).toBe('ECONNREFUSED');
  });
});
