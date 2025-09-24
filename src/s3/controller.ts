import * as Minio from 'minio';
import { randomBytes } from 'crypto';
import { type S3ConfigType, type FileMetadata, commonS3Config } from './config';
import * as fs from 'fs';
import * as path from 'path';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';
import { catchError } from '@/utils/catch';
import { mimeMap } from './const';
import {
  FileInputSchema,
  type FileInput,
  type GetUploadBufferResponse,
  type PresignedUrlInputType
} from './type';

export class S3Service {
  private client: Minio.Client;
  private externalClient?: Minio.Client;
  private config: S3ConfigType;

  constructor(config: Partial<S3ConfigType>) {
    this.config = {
      ...commonS3Config,
      ...config
    } as S3ConfigType;

    this.client = new Minio.Client({
      endPoint: this.config.endPoint,
      port: this.config.port,
      useSSL: this.config.useSSL,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      transportAgent: this.config.transportAgent
    });

    this.externalClient = this.config.externalBaseUrl
      ? (() => {
          const urlObj = new URL(this.config.externalBaseUrl);
          const endPoint = urlObj.hostname;
          const useSSL = urlObj.protocol === 'https';
          return new Minio.Client({
            endPoint,
            port: urlObj.port ? parseInt(urlObj.port) : useSSL ? 443 : 80,
            useSSL,
            accessKey: this.config.accessKey,
            secretKey: this.config.secretKey,
            transportAgent: this.config.transportAgent
          });
        })()
      : undefined;
  }

  async initialize() {
    const [, err] = await catchError(async () => {
      addLog.info(`Checking bucket: ${this.config.bucket}`);
      const bucketExists = await this.client.bucketExists(this.config.bucket);

      if (!bucketExists) {
        addLog.info(`Creating bucket: ${this.config.bucket}`);
        const [, err] = await catchError(() => this.client.makeBucket(this.config.bucket));
        if (err) {
          addLog.warn(`Failed to create bucket: ${this.config.bucket}`);
          return Promise.reject(err);
        }
      }

      if (this.config.retentionDays && this.config.retentionDays > 0) {
        const Days = this.config.retentionDays;
        const [, err] = await catchError(() =>
          Promise.all([
            this.client.setBucketPolicy(
              this.config.bucket,
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${this.config.bucket}/*`]
                  }
                ]
              })
            ),
            this.client.setBucketLifecycle(this.config.bucket, {
              Rule: [
                {
                  ID: 'AutoDeleteRule',
                  Status: 'Enabled',
                  Expiration: {
                    Days,
                    DeleteMarker: false,
                    DeleteAll: false
                  }
                }
              ]
            })
          ])
        );
        if (err) {
          addLog.warn(`Failed to set bucket policy: ${this.config.bucket}`);
        }
      }

      addLog.info(`Bucket initialized, ${this.config.bucket} configured successfully.`);
    });
    if (err) {
      const errMsg = getErrText(err);
      if (errMsg.includes('Method Not Allowed')) {
        addLog.warn(
          'Method Not Allowed - bucket may exist with different permissions,check document for more details'
        );
      } else if (errMsg.includes('Access Denied.')) {
        addLog.warn('Access Denied - check your access key and secret key');
        return;
      }
      return Promise.reject(err);
    }
  }

  private generateFileId(): string {
    return randomBytes(16).toString('hex');
  }

  private isPublicReadBucket(policy: string): boolean {
    const policyJson = JSON.parse(policy);
    return policyJson.Statement.some(
      (statement: any) => statement.Effect === 'Allow' && statement.Principal === '*'
    );
  }

  /**
   * Get the file directly.
   */
  getFile(objectName: string) {
    return this.client.getObject(this.config.bucket, objectName);
  }

  /**
   *  Get public readable URL
   */
  async generateExternalUrl(objectName: string, expiry: number = 3600): Promise<string> {
    const externalBaseUrl = this.config.externalBaseUrl;

    // 获取桶策略
    const policy = await this.client.getBucketPolicy(this.config.bucket);
    const isPublicBucket = this.isPublicReadBucket(policy);

    if (!isPublicBucket) {
      const url = await this.client.presignedGetObject(this.config.bucket, objectName, expiry);
      // 如果有 externalBaseUrl，需要把域名进行替换
      if (this.config.externalBaseUrl) {
        const urlObj = new URL(url);
        const externalUrlObj = new URL(this.config.externalBaseUrl);

        // 替换协议和域名，保留路径和查询参数
        urlObj.protocol = externalUrlObj.protocol;
        urlObj.hostname = externalUrlObj.hostname;
        urlObj.port = externalUrlObj.port;

        return urlObj.toString();
      }

      return url;
    }

    if (externalBaseUrl) {
      return `${externalBaseUrl}/${this.config.bucket}/${objectName}`;
    }

    // Default url
    const protocol = this.config.useSSL ? 'https' : 'http';
    const port =
      this.config.port && this.config.port !== (this.config.useSSL ? 443 : 80)
        ? `:${this.config.port}`
        : '';

    return `${protocol}://${this.config.endPoint}${port}/${this.config.bucket}/${objectName}`;
  }

  async uploadFileAdvanced(input: FileInput): Promise<FileMetadata> {
    const handleNetworkFile = async (input: FileInput): Promise<GetUploadBufferResponse> => {
      const response = await fetch(input.url!);
      if (!response.ok)
        return Promise.reject(
          new Error(`Download failed: ${response.status} ${response.statusText}`)
        );

      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = (() => {
        if (input.defaultFilename) return input.defaultFilename;

        const urlFilename = path.basename(new URL(input.url!).pathname) || 'downloaded_file';

        // 如果文件名没有扩展名，使用默认扩展名
        if (!path.extname(urlFilename)) {
          return urlFilename + '.bin'; // 默认扩展名
        }

        return urlFilename;
      })();

      return { buffer, filename };
    };
    const handleLocalFile = async (input: FileInput): Promise<GetUploadBufferResponse> => {
      if (!fs.existsSync(input.path!))
        return Promise.reject(new Error(`File not found: ${input.path}`));

      const buffer = await fs.promises.readFile(input.path!);
      const filename = input.defaultFilename || path.basename(input.path!);

      return { buffer, filename };
    };
    const handleBase64File = (input: FileInput): GetUploadBufferResponse => {
      const base64Data = (() => {
        const data = input.base64!;
        return data.includes(',') ? data.split(',')[1] : data; // Remove data URL prefix if present
      })();

      return {
        buffer: Buffer.from(base64Data, 'base64'),
        filename: input.defaultFilename!
      };
    };
    const handleBufferFile = (input: FileInput): GetUploadBufferResponse => {
      return { buffer: input.buffer!, filename: input.defaultFilename! };
    };
    const uploadFile = async (
      fileBuffer: Buffer,
      originalFilename: string
    ): Promise<FileMetadata> => {
      const inferContentType = (filename: string) => {
        const ext = path.extname(filename).toLowerCase();

        return mimeMap[ext] || 'application/octet-stream';
      };

      if (this.config.maxFileSize && fileBuffer.length > this.config.maxFileSize) {
        return Promise.reject(
          `File size ${fileBuffer.length} exceeds limit ${this.config.maxFileSize}`
        );
      }

      const fileId = this.generateFileId();
      const objectName = `${fileId}-${originalFilename}`;
      const uploadTime = new Date();

      const contentType = inferContentType(originalFilename);
      await this.client.putObject(this.config.bucket, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFilename)}"`,
        'x-amz-meta-original-filename': encodeURIComponent(originalFilename),
        'x-amz-meta-upload-time': uploadTime.toISOString()
      });

      const metadata: FileMetadata = {
        fileId,
        originalFilename,
        contentType,
        size: fileBuffer.length,
        uploadTime,
        accessUrl: await this.generateExternalUrl(objectName)
      };

      return metadata;
    };

    const validatedInput = FileInputSchema.parse(input);

    const { buffer, filename } = await (() => {
      if (validatedInput.url) return handleNetworkFile(validatedInput);
      if (validatedInput.path) return handleLocalFile(validatedInput);
      if (validatedInput.base64) return handleBase64File(validatedInput);
      if (validatedInput.buffer) return handleBufferFile(validatedInput);
      return Promise.reject('No valid input method provided');
    })();

    return await uploadFile(buffer, filename);
  }

  async removeFile(objectName: string) {
    await this.client.removeObject(this.config.bucket, objectName);
    addLog.info(`MinIO file deleted: ${this.config.bucket}/${objectName}`);
  }

  /**
   * Get the file's digest, which is called ETag in Minio and in fact it is MD5
   */
  async getDigest(objectName: string): Promise<string> {
    // Get the ETag of the object as its digest
    const stat = await this.client.statObject(this.config.bucket, objectName);
    // Remove quotes around ETag if present
    const etag = stat.etag.replace(/^"|"$/g, '');
    return etag;
  }

  /**
   * Generate a presigned URL for uploading a file to S3 service
   */
  generateUploadPresignedURL = async ({
    filepath,
    contentType,
    metadata,
    filename
  }: PresignedUrlInputType) => {
    const name = this.generateFileId();
    const objectName = `${filepath}/${name}`;

    const client = this.externalClient ?? this.client;

    try {
      const policy = client.newPostPolicy();
      policy.setBucket(this.config.bucket);
      policy.setKey(objectName);
      if (contentType) {
        policy.setContentType(contentType);
      }
      if (this.config.maxFileSize) {
        policy.setContentLengthRange(1, this.config.maxFileSize);
      }
      policy.setExpires(new Date(Date.now() + 10 * 60 * 1000)); // 10 mins

      policy.setUserMetaData({
        'original-filename': encodeURIComponent(filename),
        'upload-time': new Date().toISOString(),
        ...metadata
      });

      const res = await client.presignedPostPolicy(policy);
      const postURL = (() => {
        if (this.config.externalBaseUrl) {
          return `${this.config.externalBaseUrl}/${this.config.bucket}`;
        } else {
          return res.postURL;
        }
      })();
      return {
        postURL,
        formData: res.formData,
        objectName
      };
    } catch (error) {
      addLog.error('Failed to generate Upload Presigned URL', error);
      return Promise.reject(`Failed to generate Upload Presigned URL: ${getErrText(error)}`);
    }
  };

  public async getFiles(prefix: string): Promise<string[]> {
    const objectNames: string[] = [];
    const stream = this.client.listObjectsV2(this.config.bucket, prefix, true);

    for await (const obj of stream) {
      if (obj.name) {
        objectNames.push(obj.name);
      }
    }

    return objectNames;
  }

  public removeFiles(objectNames: string[]) {
    return this.client.removeObjects(this.config.bucket, objectNames);
  }
}
