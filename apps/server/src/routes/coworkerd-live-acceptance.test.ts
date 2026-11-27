import { randomUUID } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { PackCommand } from '@fastgpt-plugin/cli/commands/pack';
import { describe, expect, it } from 'vitest';

import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { makePluginConfirmUC } from '@usecase/plugin/plugin-confirm.uc';
import { makePluginUploadUC } from '@usecase/plugin/plugin-upload.uc';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { CoworkerdPluginRuntimeDriver } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/coworkerd-runtime.driver';
import { createWorkerArtifactBuilder, readWorkerArtifact } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/worker-artifact';
import { PluginPKFFileResolver } from '@infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';
import { MongoClient } from '@infrastructure/storage/mongo';

import { compileWorker, packageWorkerBundle } from '../../../../sdk/factory/src/bundler';

const COWORKERD_TOKEN = process.env.LIVE_COWORKERD_TOKEN ?? '';
const enabled = Boolean(process.env.COWORKERD_LIVE_ACCEPTANCE && COWORKERD_TOKEN);
const MONGO_URI = process.env.LIVE_MONGO_URI ?? 'mongodb://127.0.0.1:27017/fastgpt?directConnection=true';
const COWORKERD_API = process.env.LIVE_COWORKERD_API ?? 'http://127.0.0.1:18090';
const COWORKERD_INGRESS = process.env.LIVE_COWORKERD_INGRESS ?? 'http://127.0.0.1:18080';
const GATEWAY_URL = process.env.LIVE_GATEWAY_URL ?? 'http://127.0.0.1:3000/internal/plugin-invoke/v1';

describe.skipIf(!enabled)('Live cluster and MongoDB end-to-end acceptance', () => {
  it('executes full lifecycle: CLI pack -> upload build & artifact -> confirm Trial Load on live cluster -> Ingress JSON & NDJSON streaming', async () => {
    const testDir = await mkdtemp(join(process.cwd(), 'test/fixtures/tools/.live-acceptance-'));
    const testPluginId = `live_time_${randomUUID().replaceAll('-', '').slice(0, 8)}`;
    let driver: CoworkerdPluginRuntimeDriver | undefined;

    try {
      const source = join(testDir, 'getTime');
      await cp(join(process.cwd(), 'test/fixtures/tools/getTime'), source, {
        recursive: true,
        filter: (p) => !p.split('/').includes('dist')
      });

      const indexPath = join(source, 'index.ts');
      let indexContent = await readFile(indexPath, 'utf8');
      indexContent = indexContent.replace("pluginId: 'getTime'", `pluginId: '${testPluginId}'`);
      await writeFile(indexPath, indexContent);

      await mkdir(join(source, 'node_modules/@fastgpt-plugin'), { recursive: true });
      await symlink(join(process.cwd(), 'sdk/factory'), join(source, 'node_modules/@fastgpt-plugin/sdk-factory'), 'dir');

      await new PackCommand().run({
        entry: source,
        dist: './dist',
        output: testDir,
        name: testPluginId
      });
      const pkgBytes = await readFile(join(testDir, `${testPluginId}.pkg`));
      expect(pkgBytes.length).toBeGreaterThan(0);

      process.env.MONGODB_URI = MONGO_URI;
      const mongoClient = MongoClient.getInstance();
      await mongoClient.init();

      const filesMap = new Map<string, Buffer>();
      const fileStorage = {
        joinPath: (...paths: string[]) => paths.join('/'),
        save: async (input: { file: Buffer | Readable; fileKey?: string; fileName?: string; contentType?: string }) => {
          const chunks: Buffer[] = [];
          if (Buffer.isBuffer(input.file)) chunks.push(input.file);
          else for await (const chunk of input.file) chunks.push(Buffer.from(chunk));
          const bytes = Buffer.concat(chunks);
          const key = input.fileKey ?? randomUUID();
          filesMap.set(key, bytes);
          return successResult(new FileObject({
            metaData: { fileKey: key, fileName: input.fileName ?? key, contentType: (input.contentType ?? 'application/octet-stream') as any, size: bytes.length, etag: key, createTime: new Date() },
            getBuffer: async () => successResult(bytes),
            getReadStream: async () => successResult(Readable.from([bytes]))
          }));
        },
        exists: async (key: string) => successResult(filesMap.has(key)),
        getBuffer: async (key: string) => filesMap.has(key) ? successResult(filesMap.get(key)!) : failureResult({ en: 'File not found', 'zh-CN': '未找到文件' }),
        getFileObject: async (key: string) => filesMap.has(key) ? successResult(new FileObject({
          metaData: { fileKey: key, fileName: key, contentType: 'application/octet-stream' as any, size: filesMap.get(key)!.length, etag: key, createTime: new Date() },
          getBuffer: async () => successResult(filesMap.get(key)!),
          getReadStream: async () => successResult(Readable.from([filesMap.get(key)!]))
        })) : failureResult({ en: 'File not found', 'zh-CN': '未找到文件' }),
        delete: async (key: string) => { filesMap.delete(key); return successResult(true); },
        deletePath: async (prefix: string) => {
          for (const k of filesMap.keys()) if (k.startsWith(prefix)) filesMap.delete(k);
          return successResult(true);
        },
        getAccessUrl: async (key: string) => successResult(`http://files.local/${key}`),
        getBucketName: () => 'fastgpt-live'
      };

      const builder = createWorkerArtifactBuilder({
        invokeGatewayUrl: GATEWAY_URL,
        compile: compileWorker
      });

      Reflect.set(PluginRepo, '_instance', undefined);
      const repo = PluginRepo.getInstance({
        mongoClient,
        localFileStorageRepo: fileStorage as any,
        privateRemoteFileStorageRepo: fileStorage as any,
        publicRemoteFileStorageRepo: fileStorage as any,
        fileTTLManager: { cleanExpired: async () => successResult({}) } as any,
        artifactBuilder: builder
      });

      const resolver = new PluginPKFFileResolver({
        localFileStorageRepo: fileStorage as any,
        pluginRepo: repo
      });

      const uploadUC = makePluginUploadUC({
        localFileStorageRepo: fileStorage as any,
        pluginPKGFileResolver: resolver,
        pluginRepo: repo,
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
      });

      const [uploadResult, uploadErr] = await uploadUC({
        files: [{ fileName: `${testPluginId}.pkg`, file: Readable.from([pkgBytes]) }]
      });
      expect(uploadErr).toBeNull();
      expect(uploadResult?.failed ?? []).toHaveLength(0);
      expect(uploadResult?.plugins).toHaveLength(1);

      const uploadedPlugin = uploadResult!.plugins[0];
      const uniqueId = { pluginId: uploadedPlugin.pluginId, version: uploadedPlugin.version, etag: uploadedPlugin.etag };

      const [artifactBytes, artifactErr] = await repo.getWorkerArtifact(uniqueId);
      expect(artifactErr).toBeNull();
      const artifact = readWorkerArtifact(artifactBytes!, GATEWAY_URL);
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);

      const config = { tenantId: 'system', limits: { cpuMs: 200, memoryMiB: 128 } };
      driver = new CoworkerdPluginRuntimeDriver({
        config: {
          apiServerUrl: COWORKERD_API,
          ingressUrl: COWORKERD_INGRESS,
          managementToken: COWORKERD_TOKEN,
          defaultLimits: config.limits,
          internalInvokeGatewayUrl: GATEWAY_URL,
          requestTimeoutMs: 15000
        },
        defaultPluginConfig: config,
        configRepo: {
          getPluginRuntimeConfig: async () => successResult(config),
          savePluginRuntimeConfig: async () => successResult({}),
          resetPluginRuntimeConfig: async () => successResult(config)
        },
        compatibilityDate: '2026-01-01',
        resolveWorkerCode: async (id) => {
          const [bytes, err] = await repo.getWorkerArtifact(id);
          if (err) return failureResult(err);
          return successResult(readWorkerArtifact(bytes, GATEWAY_URL).code);
        },
        package: packageWorkerBundle
      });

      const confirmUC = makePluginConfirmUC({
        pluginRepo: repo,
        pluginRuntimeManager: driver,
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
      });

      const [confirmResult, confirmErr] = await confirmUC({ uniqueIds: [uniqueId] });
      expect(confirmErr).toBeNull();
      expect(confirmResult?.failed).toEqual([]);
      expect(confirmResult?.confirmed).toHaveLength(1);

      const invokeOptions = {
        invocationId: 'acceptance-' + randomUUID().slice(0, 8),
        internalInvoke: { gatewayUrl: GATEWAY_URL, issueToken: () => 'token' }
      };

      const [jsonRes, jsonErr] = await driver.invoke<{ time: string }, false>({
        uniqueId,
        eventName: 'run' as const,
        payload: { input: {}, systemVar: { time: '2026-11-04T15:20:00Z' } },
        returnStream: false,
        options: invokeOptions
      });
      expect(jsonErr).toBeNull();
      expect(jsonRes?.time).toBe('2026-11-04T15:20:00Z');

      const [streamRes, streamErr] = await driver.invoke<unknown, true>({
        uniqueId,
        eventName: 'run' as const,
        payload: { input: {}, systemVar: { time: '2026-11-04T15:20:00Z' } },
        returnStream: true,
        options: invokeOptions
      });
      expect(streamErr).toBeNull();
      const frames: unknown[] = [];
      await streamRes!.consume((frame) => { frames.push(frame); });
      expect(frames).toContainEqual({ type: 'response', data: { time: '2026-11-04T15:20:00Z' } });

      const [, unregErr] = await driver.unregister(uniqueId);
      expect(unregErr).toBeNull();
    } finally {
      await driver?.shutdown(0);
      try {
        const mongoClient = MongoClient.getInstance();
        await mongoClient.Mongo.connection.collection('system_plugins').deleteOne({ pluginId: testPluginId });
        await mongoClient.Mongo.connection.collection('plugin_installations').deleteMany({ pluginId: testPluginId });
        await mongoClient.Mongo.disconnect();
      } catch {
        // ignore cleanup errors
      }
      await rm(testDir, { recursive: true, force: true });
    }
  }, 60000);
});
