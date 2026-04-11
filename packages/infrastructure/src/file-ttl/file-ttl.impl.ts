import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import type { FileTTLPort } from '@domain/ports/file-ttl.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import type { MongoClient } from '../storage/mongo';

export type FileTTLDeps = {
  mongoClient: MongoClient;
  publicRemoteFileStorageRepo: RemoteFileStoragePort;
  privateRemoteFileStorageRepo: RemoteFileStoragePort;
};

export class FileTTLManager implements FileTTLPort {
  constructor(private deps: FileTTLDeps) {}

  async setExpiration(fileKeys: string[], bucketName: string, expiresAt: Date): Promise<Result> {
    try {
      await this.deps.mongoClient
        .getModel('s3ttl')
        .create(fileKeys.map((minioKey) => ({ bucketName, minioKey, expiredTime: expiresAt })));
      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to set expiration',
          'zh-CN': '设置过期失败'
        },
        error
      );
    }
  }

  async cleanExpired(): Promise<Result> {
    const results = await this.deps.mongoClient
      .getModel('s3ttl')
      .find({
        expiredTime: {
          $lt: new Date()
        }
      })
      .lean();

    for (const result of results) {
      const client =
        result.bucketName === 'public'
          ? this.deps.publicRemoteFileStorageRepo
          : this.deps.privateRemoteFileStorageRepo;
      await client.delete(result.minioKey);
    }

    return successResult({});
  }
}
