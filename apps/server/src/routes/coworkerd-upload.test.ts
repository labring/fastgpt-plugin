import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { constants, runInThisContext } from 'node:vm';

import { PackCommand } from '@fastgpt-plugin/cli/commands/pack';
import { describe, expect, it, vi } from 'vitest';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { makePluginConfirmUC } from '@usecase/plugin/plugin-confirm.uc';
import { makePluginUploadUC } from '@usecase/plugin/plugin-upload.uc';
import { CoworkerdPluginRuntimeDriver } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/coworkerd-runtime.driver';
import { createWorkerArtifactBuilder, readWorkerArtifact } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/worker-artifact';
import { PluginPKFFileResolver } from '@infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';

import { compileWorker, packageWorkerBundle } from '../../../../sdk/factory/src/bundler';

const gatewayUrl = 'https://gateway.invalid/internal/plugin-invoke/v1';
const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

// Real CLI ZIP, parser, Worker compiler, confirmation usecase, tar packager and
// driver; storage/installation records and coworkerd HTTP are in-memory doubles.
describe('CLI package to upload and confirmed Worker execution', () => {
  it('compiles only during upload and executes persisted code as JSON and NDJSON after confirmation', async () => {
    const directory = await mkdtemp(join(process.cwd(), 'test/fixtures/tools/.upload-flow-'));
    try {
      const source = join(directory, 'getTime');
      await cp(join(process.cwd(), 'test/fixtures/tools/getTime'), source, { recursive: true, filter: (path) => !path.split('/').includes('dist') });
      await mkdir(join(source, 'node_modules/@fastgpt-plugin'), { recursive: true });
      await symlink(join(process.cwd(), 'sdk/factory'), join(source, 'node_modules/@fastgpt-plugin/sdk-factory'), 'dir');
      await new PackCommand().run({ entry: source, dist: './dist', output: directory });
      const pkg = await readFile(join(directory, 'getTime.pkg'));
      const objects = new Map<string, Buffer>();
      const asFile = (key: string, bytes: Buffer, fileName = key) => new FileObject({
        metaData: { fileKey: key, fileName, contentType: 'application/javascript', size: bytes.length, etag: key, createTime: new Date() },
        getBuffer: async () => successResult(bytes),
        getReadStream: async () => successResult(Readable.from([bytes]))
      });
      let counter = 0;
      const local = {
        save: vi.fn(async (input) => {
          const chunks: Buffer[] = [];
          if (Buffer.isBuffer(input.file)) chunks.push(input.file);
          else for await (const chunk of input.file) chunks.push(Buffer.from(chunk));
          const key = input.fileKey ?? String(++counter);
          const bytes = Buffer.concat(chunks);
          objects.set(key, bytes);
          return successResult(asFile(key, bytes, input.fileName));
        }),
        delete: vi.fn(async (key: string) => { objects.delete(key); return successResult(true); })
      };
      const compile = vi.fn(compileWorker);
      const builder = createWorkerArtifactBuilder({ invokeGatewayUrl: gatewayUrl, compile });
      let artifact: Buffer | undefined;
      let plugin: any;
      const repo = {
        getPendingPluginIds: async () => successResult([]),
        getPluginFileAccessURL: async () => successResult('https://assets.invalid/logo.svg'),
        createPlugin: async (input) => {
          const [bytes, error] = await builder.build(input.files.index);
          if (error) return failureResult(error);
          artifact = bytes;
          plugin = input.plugin;
          return successResult({ runtimeRegistrationRequired: false });
        },
        getPluginsByPluginId: async () => successResult([]),
        listActive: async () => successResult([]),
        confirmPlugin: async () => successResult({ ...plugin, runtimeRegistrationRequired: true }),
        deletePendingPlugin: async () => successResult({}),
        disableUnreferencedPlugins: async () => successResult({ plugins: [] })
      } satisfies Partial<PluginRepoPort>;
      const pluginRepo = repo as unknown as PluginRepoPort;
      const resolver = new PluginPKFFileResolver({ localFileStorageRepo: local as never, pluginRepo });
      const [uploaded, error] = await makePluginUploadUC({ localFileStorageRepo: local as never, pluginPKGFileResolver: resolver, pluginRepo, logger })({ files: [{ fileName: 'getTime.pkg', file: Readable.from([pkg]) }] });
      expect(error).toBeNull();
      expect(uploaded?.failed).toBeUndefined();
      expect(uploaded?.plugins).toHaveLength(1);
      expect(compile).toHaveBeenCalledTimes(1);
      const uploadedCode = readWorkerArtifact(artifact!, gatewayUrl).code;
      // Repeating an upload in another temporary directory produces identical bytes.
      const indexFile = asFile('index', await readFile(join(source, 'dist/index.js')));
      const [again, againError] = await builder.build(indexFile);
      expect(againError).toBeNull();
      expect(again).toEqual(artifact);
      compile.mockClear();

      let worker: { fetch(request: Request): Promise<Response> } | undefined;
      const managementFetch = vi.fn<typeof fetch>(async (url, init) => {
        const path = new URL(String(url)).pathname;
        if (path === '/v1/status') return Response.json({ storage: { tenantsRevision: '1' }, nodes: [{ reachable: true, storage: { appliedTenantsRevision: '1' } }] });
        if (path.includes('/versions/')) {
          expect(init?.body).toBeInstanceOf(Buffer);
          const file = join(directory, 'worker.mjs');
          await writeFile(file, uploadedCode);
          worker = (await runInThisContext(`import(${JSON.stringify(pathToFileURL(file).href)})`, { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER })).default;
          return Response.json({ active: true });
        }
        return Response.json({ name: 'system' });
      });
      const config = { tenantId: 'system', limits: { cpuMs: 200, memoryMiB: 128 } };
      const driver = new CoworkerdPluginRuntimeDriver({
        config: { apiServerUrl: 'https://control.invalid', ingressUrl: 'https://ingress.invalid', managementToken: 'test', defaultLimits: config.limits, internalInvokeGatewayUrl: gatewayUrl, requestTimeoutMs: 1000 },
        defaultPluginConfig: config,
        configRepo: { getPluginRuntimeConfig: async () => successResult(config), savePluginRuntimeConfig: async () => successResult({}), resetPluginRuntimeConfig: async () => successResult(config) },
        compatibilityDate: '2026-01-01',
        resolveWorkerCode: async () => successResult(readWorkerArtifact(artifact!, gatewayUrl).code),
        package: async (options) => {
          expect(options.code).toBe(uploadedCode);
          return packageWorkerBundle(options);
        },
        managementFetch,
        ingressFetch: async (url, init) => worker!.fetch(new Request(String(url), init))
      });
      expect(managementFetch).not.toHaveBeenCalled();
      const uniqueId = { pluginId: plugin.pluginId, version: plugin.version, etag: plugin.etag };
      const [confirmed, confirmError] = await makePluginConfirmUC({ pluginRepo, pluginRuntimeManager: driver, logger })({ uniqueIds: [uniqueId] });
      expect(confirmError).toBeNull();
      expect(confirmed?.failed, JSON.stringify(logger.error.mock.calls)).toEqual([]);
      const options = { invocationId: 'test', internalInvoke: { gatewayUrl, issueToken: () => 'scoped' } };
      const arg = { uniqueId, eventName: 'run' as const, payload: { input: {}, systemVar: { time: '2026-01-01T00:00:00Z' } }, options };
      const [result, invokeError] = await driver.invoke<{ time: string }, false>({ ...arg, returnStream: false });
      expect(invokeError).toBeNull();
      expect(result?.time).toEqual(expect.any(String));
      const [stream, streamError] = await driver.invoke<unknown, true>({ ...arg, returnStream: true });
      expect(streamError).toBeNull();
      const frames: unknown[] = [];
      await stream!.consume((frame) => { frames.push(frame); });
      expect(frames).toContainEqual({ type: 'response', data: { time: expect.any(String) } });
      expect(compile).not.toHaveBeenCalled();
      await driver.shutdown(0);

      // A Node-dependent plugin still packs for LocalPool, but upload in
      // Coworkerd mode rejects it before any pending installation is created.
      await writeFile(join(source, 'src/index.ts'), `
        import { readFile } from 'node:fs/promises';
        import z from 'zod';
        export const InputType = z.object({});
        export const OutputType = z.object({ time: z.string() });
        export async function tool() { return { time: await readFile('/unsupported', 'utf8') }; }
      `);
      await new PackCommand().run({ entry: source, dist: './dist', output: directory });
      const badPkg = await readFile(join(directory, 'getTime.pkg'));
      artifact = undefined;
      const [rejected, rejectionError] = await makePluginUploadUC({ localFileStorageRepo: local as never, pluginPKGFileResolver: resolver, pluginRepo, logger })({ files: [{ fileName: 'node.pkg', file: Readable.from([badPkg]) }] });
      expect(rejectionError).toBeNull();
      expect(rejected?.plugins).toEqual([]);
      expect(rejected?.failed?.[0].reason.en).toContain('node:fs/promises');
      expect(artifact).toBeUndefined();
      expect(objects.size).toBe(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30000);
});
