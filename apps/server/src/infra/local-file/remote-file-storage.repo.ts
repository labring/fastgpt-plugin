import type { RemoteFileStoragePort } from '@fastgpt-plugin/domain/ports/infra/remote-file-storage.port';
import { BaseFileStorageRepo } from './base-file-storage.repo';
import type {
  BaseFileCreateType,
  BaseFileMeta,
  RemoteFileCreateType,
  RemoteFileMetaType
} from '@fastgpt-plugin/domain/value-objects/file.vo';
import {
  failureResult,
  successResult,
  type Result
} from '@fastgpt-plugin/domain/value-objects/result.vo';
import { createReadStream, type WriteStream } from 'node:fs';
import type { Readable } from 'node:stream';
import type { IStorage } from '@fastgpt-sdk/storage';
import { env } from '@/env';
import { createS3Clients } from '../s3';
import { MongoS3TTL } from '../mongo/models/s3-ttl.model';
import { getLogger, infra, type Logger } from '../logger';
import { logger } from '../middlewares/logger';
import { getReadStreamFromURL } from '@fastgpt-plugin/helpers/utils/stream';
import { detectContentType } from '@fastgpt-plugin/helpers/utils/content-type';
import { getMetaFromStream } from './utils';

type RemoteFileItemType = RemoteFileMetaType & {
  lock: boolean;
};

type S3Clients = {
  internalClient: IStorage;
  externalClient?: IStorage;
};

export class RemoteFileStorageRepo
  extends BaseFileStorageRepo<RemoteFileItemType>
  implements RemoteFileStoragePort
{
  private privateClients: S3Clients;
  private publicClients: S3Clients;
  public static logger: Logger = getLogger(infra.storage);

  static instance: RemoteFileStorageRepo;

  private constructor(s3Clients: { privateClients: S3Clients; publicClients: S3Clients }) {
    super({
      basePath: env.S3_FILE_BASE_PATH
    });

    this.privateClients = s3Clients.privateClients;
    this.publicClients = s3Clients.publicClients;

    this.privateClients.internalClient.ensureBucket();
  }

  static async getInstance(): Promise<RemoteFileStorageRepo> {
    if (!RemoteFileStorageRepo.instance) {
      const clients = await createS3Clients();
      if (!clients.success) {
        this.logger.error('Failed to create S3 clients', clients.error);
        return Promise.reject(clients.error);
      }
      RemoteFileStorageRepo.instance = new RemoteFileStorageRepo(clients.data);
    }
    return RemoteFileStorageRepo.instance;
  }

  async getAccessUrl(fileKey: string): Promise<Result<string>> {
    const fileItem = await this._getFileItem(fileKey);
    if (!fileItem) {
      return failureResult('File not found');
    }

    if (fileItem.access === 'private') {
      const access = await this.privateClients.internalClient.generatePresignedGetUrl({
        key: fileItem.fileKey
      });
      return successResult(access.url);
    }

    // public
    const access = this.publicClients.externalClient?.generatePublicGetUrl({
      key: fileItem.fileKey
    });

    if (!access) {
      return failureResult('Failed to generate public URL');
    }

    return successResult(access.url);
  }

  async setExpire(fileKey: string, expireAt: Date): Promise<Result<boolean>> {
    try {
      await MongoS3TTL.create({
        bucketName: this.privateClients.internalClient.bucketName,
        expiredTime: expireAt,
        minioKey: fileKey
      });
      return successResult(true);
    } catch (e) {
      return failureResult('Failed to set expire', e);
    }
  }

  async removeExpire(fileKey: string) {
    await MongoS3TTL.deleteOne({
      minioKey: fileKey
    });
  }
  async save(input: RemoteFileCreateType): Promise<Result<RemoteFileItemType>> {
    const { file, fileKey, fileName, expireAt, overwrite, access } = input;

    const client =
      access === 'public' ? this.publicClients.internalClient : this.privateClients.internalClient;

    const key = this._getFilePath(fileKey);
    const stream =
      file.stream ??
      (file.path ? createReadStream(file.path) : undefined) ??
      (file.url ? await getReadStreamFromURL(file.url) : undefined);
    const buffer = file.buffer ?? (file.base64 ? Buffer.from(file.base64, 'base64') : undefined);
    const contentType = buffer
      ? detectContentType(buffer)
      : (await getMetaFromStream(stream!)).contentType;

    const body = stream ?? buffer!; // undefined is impossible

    await client.uploadObject({
      contentType,
      key,
      body,
      contentDisposition: `attachment; filename="${fileName}"`
    });

    const getResult = await client.getObjectMetadata({
      key
    });

    return successResult({
      contentType,
      createTime: Date.now(),
      etag: getResult.etag,
      fileKey,
      fileName,
      size: getResult.contentLength,
      lock: false,
      access,
      expireAt
    });
  }
  delete(fileKey: string): Promise<Result<boolean>> {
    throw new Error('Method not implemented.');
  }
  getReadStream(fileKey: string): Promise<Result<Readable>> {
    throw new Error('Method not implemented.');
  }
  getWriteStream(fileKey: string): Promise<Result<{ stream: WriteStream; unlock: () => void }>> {
    throw new Error('Method not implemented.');
  }
  getBuffer(fileKey: string): Promise<Result<Buffer>> {
    throw new Error('Method not implemented.');
  }
  getInfo(fileKey: string): Promise<Result<BaseFileMeta>> {
    throw new Error('Method not implemented.');
  }
  exists(fileKey: string): Promise<Result<boolean>> {
    throw new Error('Method not implemented.');
  }
  move(fileKey: string, newFileKey: string): Promise<Result<boolean>> {
    throw new Error('Method not implemented.');
  }
}
