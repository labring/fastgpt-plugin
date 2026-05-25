import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';

import type { IStorage } from '@fastgpt-sdk/storage';

import { type RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import {
  type FileCreateType,
  FileMetaSchema,
  type FileMetaType
} from '@domain/value-objects/file/file.vo';
import { FileObject } from '@domain/value-objects/file/file-object.vo';
import {
  detectMimeTypeFromContent,
  getMimeTypeFromFilename,
  type MIMEType
} from '@domain/value-objects/file/MIME.vo';
import type { Result } from '@domain/value-objects/result.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { env } from '../env';
import { MongoClient } from '../storage/mongo';

export type RemoteFileStorageDeps = {
  mongoClient: MongoClient;
  s3Clients: {
    internalClient: IStorage;
    externalClient?: IStorage;
  };
};

export class RemoteFileStorageRepo implements RemoteFileStoragePort {
  private _basePath: string = env.S3_FILE_BASE_PATH;
  private _getURLExpiresIn: number = 3600;

  // static _instance: RemoteFileStorageRepo;
  // static getInstance(deps: RemoteFileStorageDeps): RemoteFileStorageRepo {
  //   if (!this._instance) {
  //     this._instance = new RemoteFileStorageRepo(deps);
  //   }
  //   return this._instance;
  // }

  public constructor(private deps: RemoteFileStorageDeps) {}

  public async init() {
    await this.deps.s3Clients.internalClient.ensureBucket();
  }

  async getFileKeysByPath(_path: string): Promise<Result<string[]>> {
    const path = this.joinPath(_path);
    const result = await this.deps.s3Clients.internalClient.listObjects({ prefix: path });
    return successResult(result.keys);
  }

  joinPath(...paths: string[]): string {
    if (paths.length === 0) return this._basePath;
    const joined = path.join(...paths);
    if (joined.startsWith(this._basePath)) return joined;
    return path.join(this._basePath, joined);
  }

  getBucketName(): string {
    return this.deps.s3Clients.internalClient.bucketName;
  }

  async getInfo(_fileKey: string): Promise<Result<FileMetaType>> {
    const fileKey = this.joinPath(_fileKey);

    try {
      const metadata = await this.deps.s3Clients.internalClient.getObjectMetadata({ key: fileKey });
      const parsed = FileMetaSchema.parse({
        contentType: metadata.contentType,
        createTime: new Date(metadata.metadata['createTime']),
        etag: metadata.etag,
        fileKey,
        fileName: metadata.metadata['fileName'],
        size: metadata.contentLength
      });

      return successResult(parsed);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to parse file metadata',
          'zh-CN': '解析文件元数据失败'
        },
        error
      );
    }
  }

  async getFileObject(_fileKey: string): Promise<Result<FileObject>> {
    const fileKey = this.joinPath(_fileKey);
    const [metaData, err] = await this.getInfo(fileKey);
    if (err) return failureResult(err);

    return successResult(
      new FileObject({
        metaData,
        getBuffer: () => this.getBuffer(fileKey),
        getReadStream: () => this.getReadStream(fileKey)
      })
    );
  }

  async getAccessUrl(_fileKey: string): Promise<Result<string>> {
    const fileKey = this.joinPath(_fileKey);

    const isPublic = !!this.deps.s3Clients.externalClient;
    const client = this.deps.s3Clients.externalClient ?? this.deps.s3Clients.internalClient;
    if (isPublic) {
      const url = client.generatePublicGetUrl({
        key: fileKey
      });
      return successResult(url.url);
    } else {
      const url = await client.generatePresignedGetUrl({
        key: fileKey,
        expiredSeconds: this._getURLExpiresIn
      });
      return successResult(url.url);
    }
  }

  async save(input: FileCreateType): Promise<Result<FileObject>> {
    const { file, fileName, contentType: providedContentType } = input;
    const fileKey = this.joinPath(input.fileKey ?? randomUUID());
    const targetFileName = fileName ?? fileKey.split('/').pop() ?? fileKey;
    const createTime = new Date();

    const isBuffer = (f: typeof file): f is Buffer => f instanceof Buffer;

    const contentType = isBuffer(file)
      ? this.resolveContentType({
          provided: providedContentType,
          detected: detectMimeTypeFromContent(file),
          fileName: targetFileName
        })
      : this.resolveContentType({
          provided: providedContentType,
          detected: 'application/octet-stream',
          fileName: targetFileName
        });

    try {
      await this.deps.s3Clients.internalClient.uploadObject({
        contentType,
        key: fileKey,
        body: file,
        contentDisposition: `attachment; filename="${targetFileName}"`,
        metadata: {
          fileName: targetFileName,
          createTime: createTime.toISOString()
        }
      });

      const getResult = await this.deps.s3Clients.internalClient.getObjectMetadata({
        key: fileKey
      });

      return successResult(
        new FileObject({
          metaData: {
            createTime,
            etag: getResult.etag ?? '',
            fileKey,
            fileName: targetFileName,
            size: getResult.contentLength ?? 0,
            contentType
          },
          getBuffer: () => this.getBuffer(fileKey),
          getReadStream: () => this.getReadStream(fileKey)
        })
      );
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File save error',
          'zh-CN': '远程文件保存错误'
        },
        e
      );
    }
  }

  async delete(_fileKey: string): Promise<Result<boolean>> {
    const fileKey = this.joinPath(_fileKey);
    try {
      await this.deps.s3Clients.externalClient?.deleteObject({
        key: this.joinPath(fileKey)
      });

      return successResult(true);
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File delete error',
          'zh-CN': '远程文件删除错误'
        },
        e
      );
    }
  }

  async getReadStream(_fileKey: string): Promise<Result<Readable>> {
    const fileKey = this.joinPath(_fileKey);
    try {
      const { body } = await this.deps.s3Clients.internalClient.downloadObject({
        key: this.joinPath(fileKey)
      });

      return successResult(body);
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File read error',
          'zh-CN': '远程文件读取错误'
        },
        e
      );
    }
  }

  async getBuffer(_fileKey: string): Promise<Result<Buffer>> {
    const fileKey = this.joinPath(_fileKey);
    try {
      const { body } = await this.deps.s3Clients.internalClient.downloadObject({
        key: fileKey
      });

      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return successResult(Buffer.concat(chunks));
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File buffer read error',
          'zh-CN': '远程文件缓冲读取错误'
        },
        e
      );
    }
  }

  async exists(_fileKey: string): Promise<Result<boolean>> {
    const fileKey = this.joinPath(_fileKey);
    const result = await this.deps.s3Clients.internalClient.checkObjectExists({ key: fileKey });
    if (result.exists) return successResult(true);
    return successResult(false);
  }

  async move(_fileKey: string, _newFileKey: string): Promise<Result<boolean>> {
    try {
      const client = this.deps.s3Clients.internalClient;

      const fileKey = this.joinPath(_fileKey);
      const newFileKey = this.joinPath(_newFileKey);

      await client.copyObjectInSelfBucket({
        sourceKey: fileKey,
        targetKey: newFileKey
      });

      await client.deleteObject({
        key: fileKey
      });

      return successResult(true);
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File move error',
          'zh-CN': '远程文件移动错误'
        },
        e
      );
    }
  }

  async deletePath(targetPath: string): Promise<Result<boolean>> {
    if (!targetPath.trim()) {
      return failureResult({
        en: 'Path is required',
        'zh-CN': '路径不能为空'
      });
    }

    const path = this.joinPath(targetPath);

    try {
      await this.deps.s3Clients.internalClient.deleteObjectsByPrefix({
        prefix: path
      });
      return successResult(true);
    } catch (e) {
      return failureResult(
        {
          en: 'Remote File delete error',
          'zh-CN': '远程文件删除错误'
        },
        e
      );
    }
  }

  private resolveContentType({
    provided,
    detected,
    fileName
  }: {
    provided?: MIMEType;
    detected: MIMEType;
    fileName: string;
  }): MIMEType {
    if (provided) {
      return provided;
    }

    if (detected !== 'application/octet-stream') {
      return detected;
    }

    return getMimeTypeFromFilename(fileName) ?? detected;
  }
}
