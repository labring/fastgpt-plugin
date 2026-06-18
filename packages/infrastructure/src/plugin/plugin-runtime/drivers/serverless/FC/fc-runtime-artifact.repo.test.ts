import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { FCRuntimeArtifactRepo } from './fc-runtime-artifact.repo';

function createFileObject(content = 'export default {}') {
  return new FileObject({
    metaData: {
      fileKey: 'source/index.js',
      fileName: 'index.js',
      contentType: 'application/javascript',
      createTime: new Date(0),
      etag: 'source-etag',
      size: content.length
    },
    getBuffer: async () => successResult(Buffer.from(content)),
    getReadStream: async () => successResult(Readable.from(content))
  });
}

describe('FCRuntimeArtifactRepo', () => {
  it('maps plugin ids to immutable artifact keys', () => {
    const repo = new FCRuntimeArtifactRepo({
      storageClient: createStorageClient(),
      bucket: 'bucket',
      prefix: 'plugin-runtime'
    });

    expect(
      repo.getArtifactKey({
        pluginId: 'getTime',
        version: '1.0.0',
        etag: 'abc'
      })
    ).toBe('plugin-runtime/getTime/1.0.0/abc/index.js');
  });

  it('skips upload when the artifact already exists', async () => {
    const storageClient = createStorageClient({ exists: true });
    const repo = new FCRuntimeArtifactRepo({
      storageClient,
      bucket: 'bucket',
      prefix: 'plugin-runtime'
    });

    const [artifact, err] = await repo.ensureArtifact({
      uniqueId: { pluginId: 'getTime', version: '1.0.0', etag: 'abc' },
      indexFile: createFileObject()
    });

    expect(err).toBeNull();
    expect(artifact).toMatchObject({ existed: true, bucket: 'bucket' });
    expect(storageClient.uploadObject).not.toHaveBeenCalled();
  });

  it('uploads missing artifacts from PluginRepo index file', async () => {
    const storageClient = createStorageClient({ exists: false });
    const repo = new FCRuntimeArtifactRepo({
      storageClient,
      bucket: 'bucket',
      prefix: 'plugin-runtime'
    });

    const [artifact, err] = await repo.ensureArtifact({
      uniqueId: { pluginId: 'getTime', version: '1.0.0', etag: 'abc' },
      indexFile: createFileObject()
    });

    expect(err).toBeNull();
    expect(artifact).toMatchObject({
      existed: false,
      key: 'plugin-runtime/getTime/1.0.0/abc/index.js'
    });
    expect(storageClient.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'plugin-runtime/getTime/1.0.0/abc/index.js',
        body: Buffer.from('export default {}')
      })
    );
  });

  it('only deletes inside configured prefix', async () => {
    const storageClient = createStorageClient();
    const repo = new FCRuntimeArtifactRepo({
      storageClient,
      bucket: 'bucket',
      prefix: 'plugin-runtime'
    });

    const [, err] = await repo.deletePrefix('other');

    expect(err?.reason.en).toContain('outside');
    expect(storageClient.deleteObjectsByPrefix).not.toHaveBeenCalled();
  });
});

function createStorageClient({ exists = false } = {}) {
  return {
    bucketName: 'bucket',
    checkObjectExists: vi.fn(async () => ({ exists })),
    getObjectMetadata: vi.fn(async () => ({
      etag: 'artifact-etag',
      contentLength: 17,
      contentType: 'application/javascript',
      metadata: {}
    })),
    uploadObject: vi.fn(async () => ({})),
    deleteObjectsByPrefix: vi.fn(async () => ({}))
  } as any;
}
