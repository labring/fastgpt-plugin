import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { IStorage } from '@fastgpt-sdk/storage';

import {
  type InvokeUploadFileInputType,
  InvokeUploadFileOutputSchema,
  type InvokeUploadFileOutputType
} from '@domain/ports/invoke.port';
import {
  detectMimeTypeFromContent,
  getMimeTypeFromFilename
} from '@domain/value-objects/file/MIME.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { InvokeUploadFileHandler } from '@infrastructure/plugin/invoke/invoke.impl';

type Deps = {
  s3Clients: {
    internalClient: IStorage;
    externalClient?: IStorage;
  };
  basePath: string;
};

const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

export const createInvokeUploadFileHandler =
  ({ s3Clients, basePath }: Deps): InvokeUploadFileHandler =>
  async ({
    token: _token,
    input
  }: {
    token: string;
    input: InvokeUploadFileInputType;
  }): Promise<Result<InvokeUploadFileOutputType>> => {
    const fileName = input.fileName ?? randomUUID();
    const fileKey = path.join(basePath, `${randomUUID()}-${fileName}`);
    const createTime = new Date();

    const contentType = Buffer.isBuffer(input.file)
      ? input.contentType ??
        detectMimeTypeFromContent(
          input.file,
          getMimeTypeFromFilename(fileName) ?? FALLBACK_CONTENT_TYPE
        )
      : input.contentType ?? getMimeTypeFromFilename(fileName) ?? FALLBACK_CONTENT_TYPE;

    try {
      await s3Clients.internalClient.uploadObject({
        key: fileKey,
        body: input.file,
        contentType,
        contentDisposition: `attachment; filename="${fileName}"`,
        metadata: {
          fileName,
          createTime: createTime.toISOString()
        }
      });

      const metadata = await s3Clients.internalClient.getObjectMetadata({
        key: fileKey
      });

      const client = s3Clients.externalClient ?? s3Clients.internalClient;
      const accessURL = s3Clients.externalClient
        ? client.generatePublicGetUrl({
            key: fileKey
          }).url
        : (
            await client.generatePresignedGetUrl({
              key: fileKey,
              expiredSeconds: 3600
            })
          ).url;

      return successResult(
        InvokeUploadFileOutputSchema.parse({
          fileName,
          contentType,
          size: metadata.contentLength ?? 0,
          etag: metadata.etag ?? '',
          createTime,
          accessURL
        })
      );
    } catch (error) {
      return failureResult(
        {
          en: 'Invoke upload file failed',
          'zh-CN': '反向调用上传文件失败'
        },
        error
      );
    }
  };
