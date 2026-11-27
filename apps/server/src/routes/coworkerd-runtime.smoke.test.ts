import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { serve, type ServerType } from '@hono/node-server';
import { describe, expect, it } from 'vitest';

import { successResult } from '@domain/value-objects/result.vo';
import { InternalPluginInvokeTokenService } from '@infrastructure/plugin/invoke/internal-invoke-token.service';
import { CoworkerdPluginRuntimeDriver } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/coworkerd-runtime.driver';

import { compileWorker, packageWorkerBundle } from '../../../../sdk/factory/src/bundler';

import { makeInternalInvokeRoute } from './internal-invoke.route';

// Explicit opt-in only. Credentials come from the process environment, never committed fixtures.
const enabled = Boolean(process.env.COWORKERD_SMOKE_API_URL && process.env.COWORKERD_SMOKE_INGRESS_URL && process.env.COWORKERD_SMOKE_TOKEN);

describe.skipIf(!enabled)('Coworkerd real-cluster driver smoke', () => {
  it('publishes, invokes JSON/NDJSON, attempts reverse HTTP and cleans up its temporary tenant', async () => {
    const tenantId = `fg-smoke-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    const directory = await mkdtemp(join(tmpdir(), 'fastgpt-coworkerd-smoke-'));
    const tokenService = new InternalPluginInvokeTokenService(randomUUID());
    let server: ServerType | undefined;
    let driver: CoworkerdPluginRuntimeDriver | undefined;
    const apiUrl = process.env.COWORKERD_SMOKE_API_URL!;
    const ingressUrl = process.env.COWORKERD_SMOKE_INGRESS_URL!;
    const managementToken = process.env.COWORKERD_SMOKE_TOKEN!;
    const entry = join(directory, 'plugin.ts');
    const reverseRequested = Boolean(process.env.COWORKERD_SMOKE_GATEWAY_HOST);
    try {
      const route = makeInternalInvokeRoute({
        tokenService, fastgptBaseUrl: 'https://unused.invalid', maxUploadBytes: 1024,
        invokeManagerFactory: (token) => ({
          userInfo: async () => successResult({ username: token, orgs: [], groups: [] }),
          getWecomCorpToken: async () => successResult({ access_token: 'test', expires_in: 60 }),
          uploadFile: async () => successResult({ accessURL: 'https://files.invalid/test' })
        })
      });
      const gatewayStatuses: number[] = [];
      const port = await new Promise<number>((resolve) => {
        server = serve({ fetch: async (request) => {
          const response = await route.fetch(request);
          gatewayStatuses.push(response.status);
          return response;
        }, hostname: '0.0.0.0', port: 0 }, (info) => resolve(info.port));
      });
      const gatewayUrl = `http://${process.env.COWORKERD_SMOKE_GATEWAY_HOST ?? '127.0.0.1'}:${port}/v1`;
      await writeFile(entry, `
        import { defineTool, createToolHandler } from '@fastgpt-plugin/sdk-factory';
        import z from 'zod';
        export default defineTool({ manifest: {}, handler: createToolHandler({
          inputSchema: z.object({ reverse: z.boolean().default(false) }),
          outputSchema: z.object({ ok: z.boolean(), username: z.string().optional(), reverseError: z.string().optional() }),
          handler: async (input, ctx) => {
            if (ctx.systemVar.invokeToken) throw new Error('Upstream credential leaked');
            ctx.streamResponse({ type: 'answer', content: 'first' });
            if (!input.reverse) return { ok: true };
            const [user, error] = await ctx.invoke.userInfo();
            return error ? { ok: false, reverseError: error.error.cause?.message ?? error.error.message } : { ok: true, username: user.username };
          }
        }) });
      `);
      const code = await compileWorker({ entry, invokeGatewayUrl: gatewayUrl });
      const pluginConfig = { tenantId, limits: { cpuMs: 200, memoryMiB: 128 } };
      driver = new CoworkerdPluginRuntimeDriver({
        config: { apiServerUrl: apiUrl, ingressUrl, managementToken, defaultLimits: pluginConfig.limits, internalInvokeGatewayUrl: gatewayUrl, requestTimeoutMs: 30_000 },
        defaultPluginConfig: pluginConfig,
        configRepo: {
          getPluginRuntimeConfig: async () => successResult(pluginConfig),
          savePluginRuntimeConfig: async () => successResult({}),
          resetPluginRuntimeConfig: async () => successResult(pluginConfig)
        },
        resolveWorkerCode: async () => successResult(code), package: packageWorkerBundle, compatibilityDate: '2026-01-01'
      });
      const uniqueId = { pluginId: 'Smoke_Test', version: '1.0.0', etag: 'test-immutable' };
      const registration = await driver.register(uniqueId);
      if (registration[1]) throw registration[1].error;
      const options = () => {
        const invocationId = randomUUID();
        return { invocationId, internalInvoke: { gatewayUrl, issueToken: (tenant: string) => tokenService.issue({ tenantId: tenant, pluginId: uniqueId.pluginId, invocationId, invokeToken: 'smoke-user' }) } };
      };
      const payload = (reverse = false) => ({ input: { reverse }, systemVar: { invokeToken: 'must-not-reach-worker' } });
      expect(await driver.invoke({ uniqueId, eventName: 'run', payload: payload(), returnStream: false, options: options() })).toEqual([{ ok: true }, null]);
      const [stream, streamError] = await driver.invoke<unknown, true>({ uniqueId, eventName: 'run', payload: payload(), returnStream: true, options: options() });
      expect(streamError).toBeNull();
      const frames: unknown[] = [];
      await stream!.consume((frame) => { frames.push(frame); });
      expect(frames).toEqual([{ type: 'stream', data: { type: 'answer', content: 'first' } }, { type: 'response', data: { ok: true } }]);
      console.info(`Driver JSON/NDJSON smoke passed for temporary tenant ${tenantId}`);
      if (reverseRequested) {
        const [result, error] = await driver.invoke({ uniqueId, eventName: 'run', payload: payload(true), returnStream: false, options: options() });
        expect(error).toBeNull();
        console.info('Reverse HTTP gateway statuses:', gatewayStatuses);
        expect(result).toEqual({ ok: true, username: 'smoke-user' });
        console.info('Real coworkerd Worker -> host HTTP gateway reverse invocation passed');
      }
      expect((await driver.unregister(uniqueId))[1]).toBeNull();
      console.info('Remote Worker removal and propagation wait passed');
    } finally {
      await driver?.shutdown(0);
      // Tenant removal is intentional: this test created it, and Worker DELETE retains immutable versions.
      try {
        const cleanup = await fetch(`${apiUrl}/v1/tenants/${tenantId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${managementToken}` },
          signal: AbortSignal.timeout(30_000),
          redirect: 'error'
        });
        expect(cleanup.ok || cleanup.status === 404).toBe(true);
        console.info(`Temporary tenant ${tenantId} cleaned up`);
      } finally {
        if (server) await new Promise<void>((resolve, reject) => {
          server!.close((error) => error ? reject(error) : resolve());
          if ('closeAllConnections' in server!) server!.closeAllConnections();
        });
        await rm(directory, { recursive: true, force: true });
      }
    }
  }, 120_000);
});
