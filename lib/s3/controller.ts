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
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { ensureDir, removeFile } from '@/utils/fs';
import { MongoS3TTL } from './ttl/schema';
import { PluginBaseS3Prefix } from '@tool/constants';
import { addMinutes } from 'date-fns';

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
      transportAgent: this.config.transportAgent,
      pathStyle: this.config.pathStyle,
      region: this.config.region
    });

    if (this.config.externalBaseURL) {
      const externalBaseURL = new URL(this.config.externalBaseURL);
      const endpoint = externalBaseURL.hostname;
      const useSSL = externalBaseURL.protocol === 'https:';

      const externalPort = externalBaseURL.port
        ? parseInt(externalBaseURL.port)
        : useSSL
          ? 443
          : undefined; // https 默认 443，其他情况让 MinIO 客户端使用默认端口

      this.externalClient = new Minio.Client({
        useSSL: useSSL,
        endPoint: endpoint,
        port: externalPort,
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
        transportAgent: this.config.transportAgent,
        pathStyle: this.config.pathStyle,
        region: this.config.region
      });
    }
  }

  async initialize(policy: 'public' | 'private') {
    // Create bucket
    const [, err] = await catchError(async () => {
      addLog.info(`Checking bucket: ${this.config.bucket}`);
      const bucketExists = await this.client.bucketExists(this.config.bucket);

      if (!bucketExists) {
        addLog.info(`Creating bucket: ${this.config.bucket}`);
        const [, err] = await catchError(() => this.client.makeBucket(this.config.bucket));
        if (err) {
          addLog.error(`Failed to create bucket: ${this.config.bucket}`);
          return;
        }
      }

      // Set bucket policy
      const [_, err] = await catchError(async () => {
        if (policy === 'public') {
          return this.client.setBucketPolicy(
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
          );
        }
        if (policy === 'private') {
          return this.client.setBucketPolicy(
            this.config.bucket,
            JSON.stringify({
              Version: '2012-10-17',
              Statement: []
            })
          );
        }
      });
      if (err) {
        addLog.warn(`Failed to set bucket policy: ${this.config.bucket}`);
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
      } else {
        return Promise.reject(err);
      }
    }

    addLog.info(`Bucket ${this.config.bucket} initialized successfully.`);
  }

  private generateFileId(): string {
    return randomBytes(8).toString('hex');
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
  async generateExternalUrl(_objectName: string, expiry: number = 3600): Promise<string> {
    const objectName = _objectName.startsWith('/') ? _objectName.slice(1) : _objectName;

    const externalBaseURL = this.config.externalBaseURL;

    // Private
    if (!this.config.isPublicRead) {
      const url = await this.client.presignedGetObject(this.config.bucket, objectName, expiry);
      // 如果有 externalBaseUrl，需要把域名进行替换
      if (this.config.externalBaseURL) {
        const urlObj = new URL(url);
        const externalUrlObj = new URL(this.config.externalBaseURL);

        // 替换协议和域名，保留路径和查询参数
        urlObj.protocol = externalUrlObj.protocol;
        urlObj.hostname = externalUrlObj.hostname;
        urlObj.port = externalUrlObj.port;

        return urlObj.toString();
      }

      return url;
    }

    // Public
    if (externalBaseURL) {
      return `${externalBaseURL}/${this.config.bucket}/${objectName}`;
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
        if (input.contentType) return input.contentType;

        const ext = path.extname(filename).toLowerCase();

        return mimeMap[ext] || 'application/octet-stream';
      };

      if (this.config.maxFileSize && fileBuffer.length > this.config.maxFileSize) {
        return Promise.reject(
          `File size ${fileBuffer.length} exceeds limit ${this.config.maxFileSize}`
        );
      }

      // const fileId = this.generateFileId();
      const prefix = input.prefix
        ? !input.prefix?.endsWith('/')
          ? input.prefix + '/'
          : input.prefix
        : PluginBaseS3Prefix + '/';
      const objectName = `${prefix}${input.keepRawFilename ? '' : this.generateFileId() + '-'}${originalFilename}`;
      if (input.expireMins) {
        await MongoS3TTL.create({
          bucketName: this.config.bucket,
          expiredTime: addMinutes(new Date(), input.expireMins),
          minioKey: objectName
        });
      }
      const uploadTime = new Date();

      const contentType = inferContentType(originalFilename);
      await this.client.putObject(this.config.bucket, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFilename)}"`,
        'x-amz-meta-original-filename': encodeURIComponent(originalFilename),
        'x-amz-meta-upload-time': uploadTime.toISOString()
      });

      const metadata: FileMetadata = {
        objectName,
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

  async removeFile(_objectName: string) {
    const objectName = _objectName.startsWith('/') ? _objectName.slice(1) : _objectName;

    addLog.debug(`MinIO file start delete: ${this.config.bucket}/${objectName}`);
    await this.client.removeObject(this.config.bucket, objectName);
    addLog.debug(`MinIO file deleted successfully: ${this.config.bucket}/${objectName}`);
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
    filename,
    maxSize,
    fileExpireMins
  }: PresignedUrlInputType) => {
    const name = this.generateFileId();
    const objectName = `${filepath}/${name}`;

    if (fileExpireMins) {
      await MongoS3TTL.create({
        bucketName: this.config.bucket,
        minioKey: objectName,
        expiredTime: addMinutes(new Date(), fileExpireMins)
      });
    }

    const client = this.externalClient ?? this.client;

    try {
      const policy = client.newPostPolicy();
      policy.setBucket(this.config.bucket);
      policy.setKey(objectName);
      if (contentType) {
        policy.setContentType(contentType);
      }
      const _maxSize = maxSize || this.config.maxFileSize;
      if (_maxSize) {
        policy.setContentLengthRange(1, _maxSize);
      }
      policy.setExpires(new Date(Date.now() + 10 * 60 * 1000)); // 10 mins

      policy.setUserMetaData({
        'original-filename': encodeURIComponent(filename),
        'upload-time': new Date().toISOString(),
        'content-disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        ...metadata
      });

      const res = await client.presignedPostPolicy(policy);
      const postURL = (() => {
        if (this.config.externalBaseURL) {
          return `${this.config.externalBaseURL}/${this.config.bucket}`;
        } else {
          return res.postURL;
        }
      })();

      await MongoS3TTL.create({
        bucketName: this.config.bucket,
        expiredTime: new Date(Date.now() + 10 * 60 * 1000),
        minioKey: objectName
      });
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
    if (prefix.startsWith('/')) {
      prefix = prefix.slice(1);
    }
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

  public getBucketName() {
    return this.config.bucket;
  }

  public async downloadFile({
    objectName,
    downloadPath
  }: {
    objectName: string;
    downloadPath: string;
  }) {
    const filename = objectName.split('/').pop() as string;
    await ensureDir(downloadPath);
    const filepath = path.join(downloadPath, filename);
    try {
      await pipeline(await this.getFile(objectName), createWriteStream(filepath)).catch(
        (err: any) => {
          addLog.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
          return Promise.reject(err);
        }
      );
      return filepath;
    } catch {
      await removeFile(filepath);
      return undefined;
    }
  }

  public async moveFiles(srcPath: string, distPath: string): Promise<void> {
    try {
      if (srcPath.startsWith('/')) {
        srcPath = srcPath.slice(1);
      }
      const normalizedSrcPath = srcPath.endsWith('/') ? srcPath : `${srcPath}/`;
      const normalizedDistPath = distPath.endsWith('/') ? distPath : `${distPath}/`;

      addLog.info(`Starting move operation from ${normalizedSrcPath} to ${normalizedDistPath}`);

      // Get all objects in source directory
      const sourceObjects = await this.getFiles(normalizedSrcPath);

      if (sourceObjects.length === 0) {
        addLog.warn(`No objects found in source directory: ${normalizedSrcPath}`);
        return;
      }

      addLog.info(`Found ${sourceObjects.length} objects to move`);

      // Prepare copy operations
      const copyPromises = sourceObjects.map(async (sourceObjectName) => {
        // Extract the relative path from source directory
        const relativePath = sourceObjectName.replace(normalizedSrcPath, '');
        const destinationObjectName = `${normalizedDistPath}${relativePath}`;

        // Copy object to destination
        await this.client.copyObject(
          this.config.bucket,
          destinationObjectName,
          `${this.config.bucket}/${sourceObjectName}`
        );

        addLog.debug(`Copied: ${sourceObjectName} -> ${destinationObjectName}`);
        return { sourceObjectName, destinationObjectName };
      });

      // Execute all copy operations
      const copyResults = await Promise.all(copyPromises);
      addLog.info(`Successfully copied ${copyResults.length} objects`);

      // Delete source objects after successful copy
      const sourceObjectNames = copyResults.map((result) => result.sourceObjectName);
      await this.removeFiles(sourceObjectNames);

      addLog.info(
        `Successfully moved ${sourceObjectNames.length} objects from ${normalizedSrcPath} to ${normalizedDistPath}`
      );
    } catch (error) {
      const errorMsg = getErrText(error);
      addLog.error(`Failed to move files from ${srcPath} to ${distPath}: ${errorMsg}`);
      return Promise.reject(error);
    }
  }

  public async moveFile(srcObjectName: string, distObjectName: string): Promise<void> {
    try {
      // Normalize object names (remove leading slashes)
      const normalizedSrcName = srcObjectName.startsWith('/')
        ? srcObjectName.slice(1)
        : srcObjectName;
      const normalizedDistName = distObjectName.startsWith('/')
        ? distObjectName.slice(1)
        : distObjectName;

      addLog.info(
        `Starting single file move operation from ${normalizedSrcName} to ${normalizedDistName}`
      );

      // Check if source object exists
      try {
        await this.client.statObject(this.config.bucket, normalizedSrcName);
      } catch (error) {
        return Promise.reject(new Error(`Source object not found: ${normalizedSrcName}`));
      }

      // Copy object to destination
      await this.client.copyObject(
        this.config.bucket,
        normalizedDistName,
        `${this.config.bucket}/${normalizedSrcName}`
      );

      addLog.debug(`Copied: ${normalizedSrcName} -> ${normalizedDistName}`);

      // Delete source object after successful copy
      await this.client.removeObject(this.config.bucket, normalizedSrcName);

      addLog.info(`Successfully moved file from ${normalizedSrcName} to ${normalizedDistName}`);
    } catch (error) {
      const errorMsg = getErrText(error);
      addLog.error(`Failed to move file from ${srcObjectName} to ${distObjectName}: ${errorMsg}`);
      return Promise.reject(error);
    }
  }
}
