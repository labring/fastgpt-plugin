import path from 'node:path';

import type { IStorage } from '@fastgpt-sdk/storage';

import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { env } from '../../../../../env';

import type { FCArtifactInfo } from './types';
import { FCRuntimeError } from './types';

export type FCRuntimeArtifactRepoDeps = {
  storageClient: Pick<
    IStorage,
    | 'bucketName'
    | 'checkObjectExists'
    | 'deleteObjectsByPrefix'
    | 'getObjectMetadata'
    | 'uploadObject'
  >;
  bucket?: string;
  prefix?: string;
};

export class FCRuntimeArtifactRepo {
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(private readonly deps: FCRuntimeArtifactRepoDeps) {
    this.bucket = deps.bucket ?? deps.storageClient.bucketName ?? env.FC_ARTIFACT_BUCKET ?? '';
    this.prefix = normalizePrefix(deps.prefix ?? env.FC_ARTIFACT_PREFIX);
  }

  getArtifactKey(uniqueId: { pluginId: string; version: string; etag: string }): string {
    return path.posix.join(
      this.prefix,
      encodeURIComponent(uniqueId.pluginId),
      encodeURIComponent(uniqueId.version),
      encodeURIComponent(uniqueId.etag),
      'index.js'
    );
  }

  async exists(key: string): Promise<Result<boolean>> {
    try {
      const result = await this.deps.storageClient.checkObjectExists({ key });
      return successResult(Boolean(result.exists));
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to check FC artifact',
          'zh-CN': '检查 FC artifact 失败'
        },
        error
      );
    }
  }

  async getObjectInfo(key: string): Promise<Result<Pick<FCArtifactInfo, 'etag' | 'size'>>> {
    try {
      const metadata = await this.deps.storageClient.getObjectMetadata({ key });
      return successResult({
        etag: metadata.etag ?? '',
        size: metadata.contentLength ?? 0
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get FC artifact info',
          'zh-CN': '获取 FC artifact 信息失败'
        },
        error
      );
    }
  }

  async putFromFileObject({
    key,
    file
  }: {
    key: string;
    file: FileObject;
  }): Promise<Result<FCArtifactInfo>> {
    const [buffer, bufferErr] = await file.fileBuffer;
    if (bufferErr) {
      return failureResult(
        {
          en: 'Failed to read plugin artifact file',
          'zh-CN': '读取插件 artifact 文件失败'
        },
        bufferErr
      );
    }

    try {
      await this.deps.storageClient.uploadObject({
        key,
        body: buffer,
        contentType: file.metaData.contentType,
        contentDisposition: `attachment; filename="${file.metaData.fileName}"`,
        metadata: {
          fileName: file.metaData.fileName,
          sourceEtag: file.metaData.etag ?? '',
          createTime: new Date().toISOString()
        }
      });

      const [info, infoErr] = await this.getObjectInfo(key);
      if (infoErr) {
        return failureResult(infoErr);
      }

      return successResult({
        bucket: this.bucket,
        key,
        existed: false,
        etag: info.etag,
        size: info.size
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to upload FC artifact',
          'zh-CN': '上传 FC artifact 失败'
        },
        new FCRuntimeError('FC_ARTIFACT_UPLOAD_FAILED', 'Failed to upload FC artifact', error)
      );
    }
  }

  async ensureArtifact({
    uniqueId,
    indexFile
  }: {
    uniqueId: { pluginId: string; version: string; etag: string };
    indexFile: FileObject;
  }): Promise<Result<FCArtifactInfo>> {
    const key = this.getArtifactKey(uniqueId);
    const [exists, existsErr] = await this.exists(key);

    if (existsErr) {
      return failureResult(existsErr);
    }

    if (exists) {
      const [info, infoErr] = await this.getObjectInfo(key);
      if (infoErr) {
        return failureResult(infoErr);
      }

      return successResult({
        bucket: this.bucket,
        key,
        existed: true,
        etag: info.etag,
        size: info.size
      });
    }

    return this.putFromFileObject({
      key,
      file: indexFile
    });
  }

  async deletePrefix(prefix: string): Promise<Result<boolean>> {
    const normalized = normalizePrefix(prefix);
    if (!normalized || !normalized.startsWith(this.prefix)) {
      return failureResult({
        en: 'FC artifact delete prefix is outside configured runtime prefix',
        'zh-CN': 'FC artifact 删除路径超出配置前缀'
      });
    }

    try {
      await this.deps.storageClient.deleteObjectsByPrefix({ prefix: normalized });
      return successResult(true);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to delete FC artifact prefix',
          'zh-CN': '删除 FC artifact 路径失败'
        },
        error
      );
    }
  }
}

function normalizePrefix(prefix: string): string {
  return prefix.trim().replace(/^\/+|\/+$/g, '') || 'plugin-runtime';
}
