import { describe, expect, it, vi } from 'vitest';

import { RemoteFileStorageRepo } from './remote-file-storage.repo';

describe('RemoteFileStorageRepo metadata', () => {
  it('accepts object metadata when the storage adapter omits etag', async () => {
    const getObjectMetadata = vi.fn().mockResolvedValue({
      key: 'system/plugin/example/1.0.0/pkg-etag/index.js',
      bucket: 'private',
      metadata: {
        fileName: 'index.js',
        createTime: '2026-08-12T00:00:00.000Z'
      },
      etag: undefined,
      contentType: 'application/javascript',
      contentLength: 42
    });
    const repo = new RemoteFileStorageRepo({
      mongoClient: {} as never,
      s3Clients: {
        internalClient: {
          bucketName: 'private',
          getObjectMetadata
        } as never
      }
    });

    const [metadata, error] = await repo.getInfo('example/1.0.0/pkg-etag/index.js');

    expect(error).toBeNull();
    expect(metadata).toMatchObject({
      fileName: 'index.js',
      etag: '',
      size: 42
    });
    expect(getObjectMetadata).toHaveBeenCalledWith({
      key: 'system/plugin/example/1.0.0/pkg-etag/index.js'
    });
  });
});
