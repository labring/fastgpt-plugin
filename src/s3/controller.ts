import * as Minio from 'minio';
import { randomBytes } from 'crypto';
import { type S3ConfigType, type FileMetadata } from './config';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { addLog } from '@/utils/log';
import { getErrText } from '@tool/utils/err';
import { catchError } from '@/utils/catch';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { mimeMap } from './const';

export const FileInputSchema = z
  .object({
    url: z.string().url('Invalid URL format').optional(),
    path: z.string().min(1, 'File path cannot be empty').optional(),
    base64: z.string().min(1, 'Base64 data cannot be empty').optional(),
    buffer: z
      .union([
        z.instanceof(Buffer, { message: 'Buffer is required' }),
        z.instanceof(Uint8Array, { message: 'Uint8Array is required' })
      ])
      .transform((data) => {
        if (data instanceof Uint8Array && !(data instanceof Buffer)) {
          return Buffer.from(data);
        }
        return data;
      })
      .optional(),
    defaultFilename: z.string().optional()
  })
  .refine(
    (data) => {
      const inputMethods = [data.url, data.path, data.base64, data.buffer].filter(Boolean);
      return inputMethods.length === 1 && (!(data.base64 || data.buffer) || data.defaultFilename);
    },
    {
      message: 'Provide exactly one input method. Filename required for base64/buffer inputs.'
    }
  );
export type FileInput = z.infer<typeof FileInputSchema>;

type GetUploadBufferResponse = { buffer: Buffer; filename: string };

export class S3Service {
  private minioClient: Minio.Client;
  private config: S3ConfigType;

  constructor(config: S3ConfigType) {
    this.config = config;

    this.minioClient = new Minio.Client({
      ...this.config,
      transportAgent: process.env.HTTP_PROXY
        ? new HttpProxyAgent(process.env.HTTP_PROXY)
        : process.env.HTTPS_PROXY
          ? new HttpsProxyAgent(process.env.HTTPS_PROXY)
          : undefined
    });
  }

  async initialize() {
    const [, err] = await catchError(async () => {
      addLog.info(`Checking bucket: ${this.config.bucket}`);
      const bucketExists = await this.minioClient.bucketExists(this.config.bucket);

      if (!bucketExists) {
        addLog.info(`Creating bucket: ${this.config.bucket}`);
        const [, err] = await catchError(() => this.minioClient.makeBucket(this.config.bucket));
        if (err) {
          addLog.error(`Failed to create bucket: ${this.config.bucket}`);
          return Promise.reject(err);
        }
      }

      if (this.config.retentionDays) {
        const Days = this.config.retentionDays;
        const [, err] = await catchError(() =>
          Promise.all([
            this.minioClient.setBucketPolicy(
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
            this.minioClient.setBucketLifecycle(this.config.bucket, {
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

  public generateAccessUrl(objectName: string): string {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const port =
      this.config.port && this.config.port !== (this.config.useSSL ? 443 : 80)
        ? `:${this.config.port}`
        : '';

    const customEndpoint = this.config.customEndpoint;
    return customEndpoint
      ? `${customEndpoint}/${objectName}`
      : `${protocol}://${this.config.endPoint}${port}/${this.config.bucket}/${objectName}`;
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
      await this.minioClient.putObject(
        this.config.bucket,
        objectName,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFilename)}"`,
          'x-amz-meta-original-filename': encodeURIComponent(originalFilename),
          'x-amz-meta-upload-time': uploadTime.toISOString()
        }
      );

      const metadata: FileMetadata = {
        fileId,
        originalFilename,
        contentType,
        size: fileBuffer.length,
        uploadTime,
        accessUrl: this.generateAccessUrl(objectName)
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
    await this.minioClient.removeObject(this.config.bucket, objectName);
    addLog.info(`MinIO file deleted: ${this.config.bucket}/${objectName}`);
  }

  /**
   * Get the file's digest, which is called ETag in Minio and in fact it is MD5
   */
  async getDigest(objectName: string): Promise<string> {
    // Get the ETag of the object as its digest
    const stat = await this.minioClient.statObject(this.config.bucket, objectName);
    // Remove quotes around ETag if present
    const etag = stat.etag.replace(/^"|"$/g, '');
    return etag;
  }
}
