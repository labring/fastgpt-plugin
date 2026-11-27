import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import type { PluginType } from '@domain/entities/plugin.entity';
import { createError } from '@domain/value-objects/error.vo';
import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { PluginRepo, type PluginRepoDeps } from './plugin.repo';

const id = { pluginId: 'worker-test', version: '1.0.0', etag: 'immutable' };
const plugin = { ...id, type: 'tool', name: { en: 'Worker', 'zh-CN': 'Worker' }, description: { en: 'Worker', 'zh-CN': 'Worker' }, icon: 'https://example.com/logo.svg', toolDescription: 'Worker' } satisfies PluginType;
const file = new FileObject({
  metaData: { fileKey: 'index', fileName: 'index.js', contentType: 'application/javascript', etag: 'file', size: 10, createTime: new Date() },
  getReadStream: async () => successResult(Readable.from(['export default {}'])),
  getBuffer: async () => successResult(Buffer.from('export default {}'))
});

function fixture(
  options: {
    existing?: boolean;
    artifact?: Buffer;
    buildFailure?: boolean;
    incomplete?: boolean;
    allowArtifactBuildFallback?: boolean;
  } = {}
) {
  const objects = new Map<string, Buffer>();
  const key = `${id.pluginId}/${id.version}/${id.etag}/worker/artifact.json`;
  if (options.artifact) objects.set(key, options.artifact);
  const record = { ...plugin, data: {}, status: 'disabled', _id: 'plugin-record', workerUploadIncomplete: options.incomplete };
  const installation = {
    findOne: vi.fn(() => ({ lean: async () => null })),
    updateOne: vi.fn(async () => ({})),
    find: vi.fn(() => ({ lean: async () => [] })),
    deleteMany: vi.fn(async () => ({}))
  };
  const model = {
    findOneAndUpdate: vi.fn(() => ({ lean: async () => record })),
    updateOne: vi.fn(async () => ({})),
    findOne: vi.fn(() => ({ lean: async () => options.existing ? record : null })),
    create: vi.fn(async () => ({ toObject: () => record })),
    find: vi.fn(() => ({ lean: async () => [record] })),
    deleteMany: vi.fn(async () => ({}))
  };
  const storage = {
    save: vi.fn(async (input) => { objects.set(input.fileKey, Buffer.isBuffer(input.file) ? input.file : Buffer.from('index')); return successResult(file); }),
    exists: vi.fn(async (key: string) => successResult(objects.has(key))),
    getBuffer: vi.fn(async (key: string) => successResult(objects.get(key)!)),
    deletePath: vi.fn(async (prefix: string) => { for (const key of objects.keys()) if (key.startsWith(prefix)) objects.delete(key); return successResult(true); }),
    getFileObject: vi.fn(async (key: string) => objects.has(key)
      ? successResult(new FileObject({ metaData: file.metaData, getBuffer: async () => successResult(objects.get(key)!), getReadStream: async () => successResult(Readable.from([])) }))
      : failureResult({ en: 'file not found', 'zh-CN': '文件未找到' }))
  };
  const artifactBuilder = {
    build: vi.fn(async () =>
      options.buildFailure
        ? failureResult(
            createError(ErrorCode.pluginRuntimeArtifactBuildFailed, {
              message: 'Worker build failed: node:fs',
              reason: { en: 'Worker build failed: node:fs', 'zh-CN': 'Worker 构建失败：node:fs' }
            })
          )
        : successResult(Buffer.from('compiled-artifact'))
    )
  };
  const deps = {
    artifactBuilder,
    allowArtifactBuildFallback: options.allowArtifactBuildFallback,
    mongoClient: {
      getModel: (name: string) =>
        name === 'plugin' ? model : name === 'pluginInstallation' ? installation : { deleteMany: vi.fn() }
    },
    privateRemoteFileStorageRepo: storage,
    publicRemoteFileStorageRepo: { ...storage, save: vi.fn(async () => successResult(file)) },
    localFileStorageRepo: { deletePath: vi.fn(async () => successResult(true)) }
  };
  // Each test gets a fresh repository while exercising its public storage lifecycle.
  Reflect.set(PluginRepo, '_instance', undefined);
  const repo = PluginRepo.getInstance(deps as unknown as PluginRepoDeps);
  return { repo, deps, storage, model, installation, artifactBuilder, objects, key };
}

const create = (f: ReturnType<typeof fixture>, source = 'system') => f.repo.createPlugin({ plugin, files: { index: file, manifest: file }, pending: true, source });

describe('Worker artifact upload lifecycle', () => {
  it('fails before storage or pending creation when Worker compilation fails', async () => {
    const f = fixture({ buildFailure: true });
    expect((await create(f))[1]?.reason.en).toContain('node:fs');
    expect(f.storage.save).not.toHaveBeenCalled();
    expect(f.installation.updateOne).not.toHaveBeenCalled();
    expect(f.model.create).not.toHaveBeenCalled();
  });

  it('preserves raw index.js without writing worker artifact when allowArtifactBuildFallback is enabled', async () => {
    const f = fixture({ buildFailure: true, allowArtifactBuildFallback: true });
    const [res, err] = await create(f);
    expect(err).toBeNull();
    expect(res).toEqual({ runtimeRegistrationRequired: false });
    expect(f.objects.has(f.key)).toBe(false);
    expect(f.objects.has(`${id.pluginId}/${id.version}/${id.etag}/index.js`)).toBe(true);
    expect(f.installation.updateOne).toHaveBeenCalled();
  });

  it('saves the derived artifact before pending is visible and reads it after repository restart', async () => {
    const f = fixture();
    f.installation.updateOne.mockImplementation(async () => {
      expect(f.objects.get(f.key)?.toString()).toBe('compiled-artifact');
      return {};
    });
    expect((await create(f))[1]).toBeNull();
    Reflect.set(PluginRepo, '_instance', undefined);
    const restarted = PluginRepo.getInstance(f.deps as unknown as PluginRepoDeps);
    expect(await restarted.getWorkerArtifact(id)).toEqual([Buffer.from('compiled-artifact'), null]);
  });

  it('builds an artifact for an existing plugin shared by another source', async () => {
    const f = fixture({ existing: true });
    expect((await create(f, 'team-b'))[1]).toBeNull();
    expect(f.objects.get(f.key)?.toString()).toBe('compiled-artifact');
    expect(f.model.create).not.toHaveBeenCalled();
  });

  it('reuses identical artifacts and rejects changed code without overwriting shared bytes', async () => {
    const same = fixture({ existing: true, artifact: Buffer.from('compiled-artifact') });
    expect((await create(same))[1]).toBeNull();
    expect(same.storage.save).not.toHaveBeenCalled();
    const changed = fixture({ existing: true, artifact: Buffer.from('original-artifact') });
    expect((await create(changed))[1]?.reason.en).toContain('changed');
    expect(changed.objects.get(changed.key)?.toString()).toBe('original-artifact');
    expect(changed.installation.updateOne).not.toHaveBeenCalled();
  });

  it('leaves failed storage writes discoverable for cleanup and never creates pending', async () => {
    const f = fixture();
    f.storage.save.mockResolvedValueOnce(failureResult({ en: 'storage unavailable', 'zh-CN': '存储不可用' }) as never);
    expect((await create(f))[1]).not.toBeNull();
    expect(f.installation.updateOne).not.toHaveBeenCalled();
    expect(f.model.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'disabled', workerUploadIncomplete: true, uploadExpiresAt: expect.any(Date)
    }));
  });

  it('retries incomplete file persistence instead of treating it as a complete shared plugin', async () => {
    const f = fixture({ existing: true, incomplete: true, artifact: Buffer.from('compiled-artifact') });
    expect((await create(f))[1]).toBeNull();
    expect(f.storage.save).toHaveBeenCalledWith(expect.objectContaining({ fileKey: 'worker-test/1.0.0/immutable/index.js' }));
    expect(f.model.updateOne).toHaveBeenCalledWith(id, { $unset: { workerUploadIncomplete: 1 } });
  });

  it('converts unexpected storage exceptions into upload failures', async () => {
    const f = fixture({ existing: true });
    f.storage.exists.mockRejectedValueOnce(new Error('connection lost'));
    expect((await create(f))[1]?.reason.en).toBe('Failed to store plugin upload');
    expect(f.installation.updateOne).not.toHaveBeenCalled();
  });

  it('keeps shared files while another valid installation references them', async () => {
    const f = fixture({ artifact: Buffer.from('compiled-artifact') });
    f.installation.find.mockReturnValue({ lean: async () => [{ pluginObjectId: 'plugin-record' }] } as never);
    expect((await f.repo.pruneDisabled())[0]?.count).toBe(0);
    expect(f.storage.deletePath).not.toHaveBeenCalled();
  });

  it('skips expired uploads renewed before the cleanup claim', async () => {
    const f = fixture({ artifact: Buffer.from('compiled-artifact') });
    f.model.findOneAndUpdate.mockReturnValue({ lean: async () => null } as never);
    expect((await f.repo.pruneExpiredUploads())[0]?.count).toBe(0);
    expect(f.storage.deletePath).not.toHaveBeenCalled();
    expect(f.model.deleteMany).toHaveBeenCalledWith({ _id: { $in: [] } });
  });

  it('rejects reupload while cleanup owns the plugin files', async () => {
    const f = fixture({ existing: true });
    f.model.findOneAndUpdate.mockReturnValue({ lean: async () => null } as never);
    expect((await create(f))[1]).not.toBeNull();
    expect(f.storage.save).not.toHaveBeenCalled();
    expect(f.installation.updateOne).not.toHaveBeenCalled();
  });

  it('prunes the whole plugin prefix including artifacts once pending references expire', async () => {
    const f = fixture({ artifact: Buffer.from('compiled-artifact') });
    expect((await f.repo.pruneDisabled())[0]?.count).toBe(1);
    expect(f.objects.size).toBe(0);
    expect(f.storage.deletePath).toHaveBeenCalledWith('worker-test/1.0.0/immutable/');
    expect(f.installation.find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.arrayContaining([{ status: 'pending', expiredAt: { $gt: expect.any(Date) } }]) }), expect.anything());
  });

  describe('Worker artifact JIT compilation fallback', () => {
    it('compiles and persists artifact on demand when artifact.json is missing but index.js exists', async () => {
      const f = fixture({ existing: true });
      f.objects.set(`${id.pluginId}/${id.version}/${id.etag}/index.js`, Buffer.from('index-code'));

      const [result, error] = await f.repo.getWorkerArtifact(id);
      expect(error).toBeNull();
      expect(result).toEqual(Buffer.from('compiled-artifact'));
      expect(f.artifactBuilder.build).toHaveBeenCalled();
      expect(f.objects.get(f.key)?.toString()).toBe('compiled-artifact');
      expect(f.model.updateOne).toHaveBeenCalledWith(id, expect.objectContaining({
        $set: expect.objectContaining({ workerArtifactHash: expect.any(String) })
      }));
    });

    it('fails cleanly when both artifact.json and index.js are missing', async () => {
      const f = fixture({ existing: true });
      const [result, error] = await f.repo.getWorkerArtifact(id);
      expect(result).toBeNull();
      expect(error?.reason.en).toContain('Worker artifact is missing');
    });

    it('fails cleanly when JIT artifactBuilder build fails', async () => {
      const f = fixture({ existing: true, buildFailure: true });
      f.objects.set(`${id.pluginId}/${id.version}/${id.etag}/index.js`, Buffer.from('index-code'));
      const [result, error] = await f.repo.getWorkerArtifact(id);
      expect(result).toBeNull();
      expect(error?.reason.en).toContain('node:fs');
    });

    it('fails with missing artifact error without attempting JIT build when artifactBuilder is not provided', async () => {
      const f = fixture({ existing: true });
      f.objects.set(`${id.pluginId}/${id.version}/${id.etag}/index.js`, Buffer.from('index-code'));
      Reflect.set(PluginRepo, '_instance', undefined);
      const repoWithoutBuilder = PluginRepo.getInstance({ ...f.deps, artifactBuilder: undefined } as unknown as PluginRepoDeps);
      const [result, error] = await repoWithoutBuilder.getWorkerArtifact(id);
      expect(result).toBeNull();
      expect(error?.reason.en).toContain('Worker artifact is missing');
      expect(f.artifactBuilder.build).not.toHaveBeenCalled();
    });
  });
});
