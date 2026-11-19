import { describe, expect, it, vi } from 'vitest';

import type { CoworkerdPluginConfigType } from '@domain/entities/plugin-coworkerd.entity';
import type { PluginRuntimeInvokeOptions } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import type { RuntimeMetricsRecorder } from '@infrastructure/metrics';

import { CoworkerdPluginRuntimeDriver, type CoworkerdRuntimeDeps } from './coworkerd-runtime.driver';

const id = { pluginId: 'Get_Time', version: '1.0.0', etag: 'etag-1' };
const defaults: CoworkerdPluginConfigType = { tenantId: 'system', limits: { cpuMs: 200, memoryMiB: 128 } };
const gatewayUrl = 'https://plugin.internal/internal/plugin-invoke/v1';

function fixture(overrides: Partial<CoworkerdRuntimeDeps> = {}) {
  let config = structuredClone(defaults);
  let revision = 1;
  const calls: { path: string; method?: string; body: unknown }[] = [];
  const managementFetch = vi.fn<typeof fetch>(async (url, init) => {
    const path = new URL(String(url)).pathname;
    calls.push({ path, method: init?.method, body: init?.body });
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer management-only');
    if (path === '/v1/status') return Response.json({ storage: { tenantsRevision: String(revision) }, nodes: [{ nodeId: 'node-1', reachable: true, storage: { appliedTenantsRevision: String(revision) } }] });
    if (path.endsWith('/system')) return Response.json({ name: 'system' });
    if (init?.method === 'GET' && path.includes('/workers/')) {
      const workerId = path.split('/').at(-1)!;
      return Response.json({ workerId: `system/${workerId}`, activeVersion: `v-${workerId.slice(3)}`, valid: true, versions: [] });
    }
    revision++;
    if (path.includes('/versions/')) return Response.json({ active: true });
    return new Response(null, { status: 204 });
  });
  const ingressFetch = vi.fn<typeof fetch>(async (_url, init) => new Headers(init?.headers).get('Accept') === 'application/x-ndjson'
    ? new Response('{"event":"chunk","data":{"ok":true}}\n{"event":"end"}\n', { headers: { 'Content-Type': 'application/x-ndjson' } })
    : Response.json({ ok: true }));
  const build = vi.fn<CoworkerdRuntimeDeps['package'] & object>().mockResolvedValue({ bundle: Buffer.from('tar'), contentHash: 'hash' });
  const resolveWorkerCode = vi.fn<CoworkerdRuntimeDeps['resolveWorkerCode']>().mockResolvedValue(successResult('compiled-worker-code'));
  const configRepo = {
    getPluginRuntimeConfig: vi.fn(async () => successResult(structuredClone(config))),
    savePluginRuntimeConfig: vi.fn(async (_pluginId: string, value: CoworkerdPluginConfigType) => { config = structuredClone(value); return successResult({}); }),
    resetPluginRuntimeConfig: vi.fn(async () => { config = structuredClone(defaults); return successResult(structuredClone(defaults)); })
  };
  const metricsRecorder: RuntimeMetricsRecorder = {
    recordInvocationStarted: vi.fn(),
    recordInvocationCompleted: vi.fn(),
    recordInvocationFailed: vi.fn(),
    recordPodCrash: vi.fn(),
    recordPodStartup: vi.fn(),
    recordFallback: vi.fn()
  };
  const deps: CoworkerdRuntimeDeps = {
    config: { apiServerUrl: 'https://management.internal', ingressUrl: 'https://ingress.internal', managementToken: 'management-only', defaultLimits: defaults.limits, internalInvokeGatewayUrl: gatewayUrl, requestTimeoutMs: 1000 },
    defaultPluginConfig: defaults, configRepo, resolveWorkerCode, package: build,
    compatibilityDate: '2026-01-01', managementFetch, ingressFetch,
    propagationTimeoutMs: 30, propagationPollMs: 1,
    metricsRecorder,
    ...overrides
  };
  const driver = new CoworkerdPluginRuntimeDriver(deps);
  const issueToken = vi.fn(() => 'scoped-token');
  const options: PluginRuntimeInvokeOptions = { invocationId: 'invoke-1', internalInvoke: { gatewayUrl, issueToken } };
  const invoke = (stream = false, opts = options) => driver.invoke({ uniqueId: id, eventName: 'run', payload: { input: {}, secrets: { apiKey: 'business-secret' }, systemVar: { invokeToken: 'upstream-private' } }, returnStream: stream, options: opts });
  return { driver, deps, managementFetch, ingressFetch, calls, build, resolveWorkerCode, configRepo, issueToken, options, invoke, metricsRecorder };
}

describe('CoworkerdPluginRuntimeDriver', () => {
  it('publishes an activating trial-load archive, applies limits and waits for node revisions', async () => {
    const f = fixture();
    expect((await f.driver.register(id))[1]).toBeNull();
    expect(f.build).toHaveBeenCalledWith(expect.objectContaining({ code: 'compiled-worker-code', tenantId: 'system', activate: true }));
    const buildOptions = f.build.mock.calls[0][0];
    expect(buildOptions.workerId).toMatch(/^fg-[a-f0-9]{48}$/);
    expect(f.calls.map((c) => [c.method, c.path])).toEqual([
      ['GET', '/v1/tenants/system'],
      ['PUT', `/v1/tenants/system/workers/${buildOptions.workerId}/versions/${buildOptions.versionId}`],
      ['PATCH', `/v1/tenants/system/workers/${buildOptions.workerId}`],
      ['GET', '/v1/status']
    ]);
    expect(String(f.managementFetch.mock.calls[1][0])).toContain('?activate=true');
    expect(f.ingressFetch).not.toHaveBeenCalled();
    expect(f.issueToken).not.toHaveBeenCalled();
  });

  it('coalesces concurrent registrations and does not repackage an already registered deployment', async () => {
    const f = fixture();
    await Promise.all([f.driver.register(id), f.driver.register(id)]);
    await f.driver.register(id);
    expect(f.build).toHaveBeenCalledTimes(1);
  });

  it('uses distinct physical Workers for versions, etags and plugin IDs with deterministic restart addresses', async () => {
    const f = fixture();
    for (const uniqueId of [id, { ...id, version: '2.0.0' }, { ...id, etag: 'etag-2' }, { ...id, pluginId: 'another' }]) await f.driver.register(uniqueId);
    expect(new Set(f.build.mock.calls.map(([options]) => options.workerId)).size).toBe(4);
    const restarted = fixture();
    await restarted.driver.register(id);
    expect(restarted.build.mock.calls[0][0].workerId).toBe(f.build.mock.calls[0][0].workerId);
  });

  it('issues context immediately before ingress and never exposes host callbacks or upstream credentials', async () => {
    const f = fixture();
    expect(await f.invoke()).toEqual([{ ok: true }, null]);
    expect(f.issueToken).toHaveBeenCalledWith('system');
    const [url, init] = f.ingressFetch.mock.calls[0];
    expect(String(url)).toContain(`/system/${f.build.mock.calls[0][0].workerId}/run`);
    const headers = new Headers(init?.headers);
    expect(headers.get('x-fastgpt-plugin-id')).toBe('Get_Time');
    expect(headers.get('x-fastgpt-invocation-id')).toBe('invoke-1');
    expect(headers.get('x-fastgpt-invoke-token')).toBe('scoped-token');
    expect(headers.get('Authorization')).toBeNull();
    expect(String(init?.body)).not.toMatch(/upstream-private|management-only|issueToken/);
    expect(JSON.parse(String(init?.body)).payload.secrets.apiKey).toBe('business-secret');
  });

  it('preserves streaming output and releases transport accounting', async () => {
    const f = fixture();
    const [stream, error] = await f.invoke(true);
    expect(error).toBeNull();
    const chunks: unknown[] = [];
    await (stream as StreamData<unknown>).consume((chunk) => { chunks.push(chunk); });
    expect(chunks).toEqual([{ ok: true }]);
    expect((await f.driver.status(id))[0]?.inFlight).toBe(0);
  });

  it.each([undefined, { invocationId: 'i' }, { invocationId: 'i', internalInvoke: { gatewayUrl: 'https://wrong.invalid', issueToken: () => 'token' } }])('rejects missing/mismatched reverse invocation context', async (options) => {
    const f = fixture();
    const result = await f.driver.invoke({ uniqueId: id, eventName: 'run', payload: {}, returnStream: false, options });
    expect(result[1]).not.toBeNull();
    expect(f.ingressFetch).not.toHaveBeenCalled();
  });

  it('records metrics for started, completed and failed invocations', async () => {
    const f = fixture();
    await f.invoke(false);
    expect(f.metricsRecorder.recordInvocationStarted).toHaveBeenCalledWith(expect.objectContaining({
      pluginId: 'Get_Time',
      runtimeMode: 'coworkerd'
    }));
    expect(f.metricsRecorder.recordInvocationCompleted).toHaveBeenCalledWith(expect.objectContaining({
      pluginId: 'Get_Time',
      runtimeMode: 'coworkerd',
      durationMs: expect.any(Number)
    }));

    // Ingress error records failed metrics
    f.ingressFetch.mockResolvedValueOnce(
      Response.json({ code: 'CPU_LIMIT_EXCEEDED', reason: 'cpu limit' }, { status: 503 })
    );
    const [, err] = await f.invoke(false);
    expect(err?.code).toBe(ErrorCode.pluginInvokeCpuLimitExceeded);
    expect(f.metricsRecorder.recordInvocationFailed).toHaveBeenCalledWith(expect.objectContaining({
      pluginId: 'Get_Time',
      runtimeMode: 'coworkerd',
      failureKind: 'cpu_limit_exceeded'
    }));
  });

  it('circuit breaker trips on transport failures and fails fast with pluginRuntimeClusterUnavailable', async () => {
    const f = fixture({
      circuitBreakerOptions: { failureThreshold: 2, resetTimeoutMs: 500 }
    });

    f.ingressFetch.mockRejectedValue(new TypeError('fetch failed'));

    // First failure
    await f.invoke();
    expect((await f.driver.status(id))[0]?.circuitBreaker?.state).toBe('closed');

    // Second failure reaches threshold -> breaker trips to open
    await f.invoke();
    expect((await f.driver.status(id))[0]?.circuitBreaker?.state).toBe('open');

    // Third call fails fast without calling ingressFetch
    f.ingressFetch.mockClear();
    const [, fastFailErr] = await f.invoke();
    expect(fastFailErr?.code).toBe(ErrorCode.pluginRuntimeClusterUnavailable);
    expect(f.ingressFetch).not.toHaveBeenCalled();
    expect(f.metricsRecorder.recordInvocationFailed).toHaveBeenCalledWith(expect.objectContaining({
      failureKind: 'circuit_breaker_open'
    }));
  });

  it('rejects unsupported events before publishing', async () => {
    const f = fixture();
    expect((await f.driver.invoke({ uniqueId: id, eventName: 'unknown', payload: {}, returnStream: false }))[1]).not.toBeNull();
    expect(f.build).not.toHaveBeenCalled();
  });

  it('does not publish when the persisted artifact cannot be read or packaged', async () => {
    const f = fixture();
    f.resolveWorkerCode.mockResolvedValueOnce(failureResult(new Error('artifact missing')));
    expect((await f.driver.register(id))[1]).not.toBeNull();
    expect(f.managementFetch).not.toHaveBeenCalled();
    f.build.mockRejectedValueOnce(new Error('archive failed'));
    expect((await f.driver.register(id))[1]).not.toBeNull();
    expect(f.managementFetch).not.toHaveBeenCalled();
  });

  it('surfaces LOAD_FAILED and never marks the failed deployment registered', async () => {
    const f = fixture();
    f.managementFetch.mockImplementation(async (url) => String(url).includes('/versions/')
      ? Response.json({ code: 'LOAD_FAILED', reason: 'trial failed' }, { status: 422 })
      : Response.json({ name: 'system' }));
    expect((await f.driver.register(id))[1]?.code).toBe(ErrorCode.pluginRuntimeTrialLoadFailed);
    expect((await f.driver.status(id))[0]?.registered).toBe(false);
    expect(f.ingressFetch).not.toHaveBeenCalled();
  });

  it('waits for all serving nodes, ignores draining nodes and does not invoke readiness probes', async () => {
    let reads = 0;
    const f = fixture();
    const fallback = f.managementFetch.getMockImplementation()!;
    f.managementFetch.mockImplementation(async (url, init) => {
      if (new URL(String(url)).pathname !== '/v1/status') return fallback(url, init);
      return Response.json({ storage: { tenantsRevision: '9007199254740994' }, nodes: [
        { nodeId: 'n1', reachable: true, storage: { appliedTenantsRevision: ++reads > 1 ? '9007199254740994' : '9007199254740993' } },
        { nodeId: 'n2', reachable: true, drain: { draining: true }, storage: { appliedTenantsRevision: '0' } }
      ] });
    });
    expect((await f.driver.register(id))[1]).toBeNull();
    expect(reads).toBe(2);
    expect(f.ingressFetch).not.toHaveBeenCalled();
  });

  it('reports propagation timeout without marking the deployment ready or deleting possibly active code', async () => {
    const f = fixture();
    const fallback = f.managementFetch.getMockImplementation()!;
    f.managementFetch.mockImplementation(async (url, init) => String(url).endsWith('/v1/status')
      ? Response.json({ storage: { tenantsRevision: '3' }, nodes: [{ nodeId: 'n', reachable: false }] })
      : fallback(url, init));
    const [, error] = await f.driver.register(id);
    expect((error?.error.cause as Error)?.message).toContain('propagation timed out');
    // The API server can report the new desired state before all nodes apply it;
    // register returned a propagation timeout, so callers must not treat it as ready.
    expect((await f.driver.status(id))[0]?.registered).toBe(true);
    expect(f.calls.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('persists only validated configuration and applies new limits before the next invocation', async () => {
    const f = fixture();
    await f.driver.register(id);
    const updated = { ...defaults, limits: { cpuMs: 500, memoryMiB: 256 } };
    expect((await f.driver.updateConfig(id.pluginId, updated))[1]).toBeNull();
    expect(await f.driver.getConfig(id.pluginId)).toEqual([updated, null]);
    await f.invoke();
    expect(f.build).toHaveBeenCalledTimes(1);
    expect(f.calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(String(c.body)))).toEqual([{ limits: defaults.limits }, { limits: updated.limits }]);
    expect((await f.driver.updateConfig(id.pluginId, { ...updated, tenantId: 'another' }))[1]).not.toBeNull();
    expect((await f.driver.updateConfig(id.pluginId, { ...updated, token: 'secret' } as never))[1]).not.toBeNull();
    await f.driver.resetConfig(id.pluginId);
    expect(f.configRepo.resetPluginRuntimeConfig).toHaveBeenCalledWith(id.pluginId);
    expect(await f.driver.getConfig(id.pluginId)).toEqual([defaults, null]);
  });

  it('reconstructs registration status after a host restart and distinguishes a removed Worker', async () => {
    const f = fixture();
    const status = await f.driver.status(id);
    expect(status[0]).toMatchObject({ registered: true, deployment: { tenantId: 'system', workerId: expect.stringMatching(/^fg-/), versionId: expect.stringMatching(/^v-/) }, remote: { valid: true } });
    const absent = fixture();
    absent.managementFetch.mockImplementation(async (url) => String(url).includes('/workers/')
      ? Response.json({ code: 'NOT_FOUND', reason: 'not deployed' }, { status: 404 })
      : Response.json({ name: 'system' }));
    expect((await absent.driver.status(id))[0]).toEqual({ registered: false, inFlight: 0 });
  });

  it('unregisters a stable address after a host restart, preserving other versions and tenant data', async () => {
    const f = fixture();
    await f.driver.unregister(id);
    expect(f.calls.filter((c) => c.method === 'DELETE')).toHaveLength(2);
    expect(f.calls.find((c) => c.method === 'DELETE')?.path).toMatch(/\/workers\/fg-/);
    expect(f.calls.find((c) => c.method === 'DELETE' && c.path.includes('/versions/'))?.path).toMatch(/\/versions\/v-/);
    expect(f.build).not.toHaveBeenCalled();
  });

  it('shuts down without deleting remote deployments and rejects new work', async () => {
    const f = fixture();
    await f.driver.register(id);
    expect((await f.driver.shutdown(0))[1]).toBeNull();
    expect(f.calls.some((c) => c.method === 'DELETE')).toBe(false);
    expect((await f.driver.register(id))[1]).not.toBeNull();
    expect((await f.invoke())[1]).not.toBeNull();
  });

  it('aborts an active HTTP request at the shutdown deadline', async () => {
    const f = fixture();
    let started!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    f.ingressFetch.mockImplementation(async (_url, init) => {
      started();
      return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    });
    const request = f.invoke();
    await ready;
    await f.driver.shutdown(0);
    expect((await request)[1]).not.toBeNull();
  });
});
