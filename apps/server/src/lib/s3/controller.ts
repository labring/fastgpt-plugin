import { env } from '@/env';
import {
  createStorage,
  MinioStorageAdapter,
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions,
  type IStorage,
  type IStorageOptions
} from '@fastgpt-sdk/storage';
import { getLogger } from '@logtape/logtape';
import { randomBytes } from 'crypto';
import { addMinutes, differenceInSeconds } from 'date-fns';
import * as fs from 'fs';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { mimeMap } from './const';
import { MongoS3TTL } from './ttl/schema';
import {
  FileInputSchema,
  type FileInput,
  type GetUploadBufferResponse,
  type PresignedUrlInputType
} from './type';
import { infra } from '../logger';
import { ensureDir } from '@fastgpt-plugin/helpers/common/fs';
import { rm } from 'fs/promises';
import type { FileMetadata } from '@fastgpt-plugin/helpers/common/schemas/s3';
import { getErrText } from '@/utils/err';
import { createDefaultStorageOptions } from './config';

type StorageConfigWithoutBucket = Omit<IStorageOptions, 'bucket'>;

const logger = getLogger(infra.storage);

export class S3Service {
  static readonly MAX_FILE_SIZE: number = env.MAX_FILE_SIZE;

  constructor(
    private readonly _client: IStorage,
    private readonly _externalClient: IStorage | undefined
  ) {}

  async checkHealth() {
    await this._client.ensureBucket();
    return;
  }

  get client(): IStorage {
    return this._client;
  }

  get externalClient(): IStorage {
    return this._externalClient ?? this._client;
  }

  get bucketName(): string {
    return this.client.bucketName;
  }

  private generateFileId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Get the file directly.
   */
  async getFile(objectName: string) {
    const { body } = await this.client.downloadObject({ key: objectName });
    return body;
  }

  /**
   *  Get public readable URL
   */
  generateExternalUrl(_objectName: string) {
    const { url } = this.externalClient.generatePublicGetUrl({ key: _objectName });
    return url;
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

      if (S3Service.MAX_FILE_SIZE && fileBuffer.length > S3Service.MAX_FILE_SIZE) {
        return Promise.reject(
          `File size ${fileBuffer.length} exceeds limit ${S3Service.MAX_FILE_SIZE}`
        );
      }

      if (!input.prefix || typeof input.prefix !== 'string') {
        return Promise.reject('Invalid prefix');
      }

      const prefix = !input.prefix.endsWith('/') ? input.prefix + '/' : input.prefix;

      const objectName = `${prefix}${input.keepRawFilename ? '' : this.generateFileId() + '-'}${originalFilename}`;

      if (input.expireMins) {
        await MongoS3TTL.create({
          bucketName: this.bucketName,
          expiredTime: addMinutes(new Date(), input.expireMins),
          minioKey: objectName
        });
      }

      const uploadTime = new Date();

      const contentType = inferContentType(originalFilename);

      await this.client.uploadObject({
        key: objectName,
        body: fileBuffer,
        contentType: contentType,
        contentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
        metadata: {
          originalFilename: encodeURIComponent(originalFilename),
          uploadTime: uploadTime.toISOString()
        }
      });

      const metadata: FileMetadata = {
        objectName,
        originalFilename,
        contentType,
        size: fileBuffer.length,
        uploadTime,
        accessUrl: this.generateExternalUrl(objectName)
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

    logger.debug(`MinIO file start delete: ${this.bucketName}/${objectName}`);
    await this.client.deleteObject({ key: objectName });
    logger.debug(`MinIO file deleted successfully: ${this.bucketName}/${objectName}`);
  }

  /**
   * Get the file's digest, which is called ETag in Minio and in fact it is MD5
   */
  async getDigest(objectName: string): Promise<string> {
    // Get the ETag of the object as its digest
    const metadataResponse = await this.client.getObjectMetadata({ key: objectName });
    // Remove quotes around ETag if present
    const etag = metadataResponse.etag?.replace(/^"|"$/g, '') || '';
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
    // maxSize,
    fileExpireMins
  }: PresignedUrlInputType) => {
    const name = this.generateFileId();
    const objectName = `${filepath}/${name}`;

    try {
      await MongoS3TTL.create({
        bucketName: this.bucketName,
        minioKey: objectName,
        expiredTime: addMinutes(new Date(), fileExpireMins ?? 60)
      });

      const now = new Date();
      const {
        key,
        metadata: headers,
        url
      } = await this.externalClient.generatePresignedPutUrl({
        key: objectName,
        expiredSeconds: differenceInSeconds(addMinutes(now, 10), now),
        contentType: contentType,
        metadata: {
          originalFilename: encodeURIComponent(filename),
          uploadTime: now.toISOString(),
          contentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
          ...metadata
        }
      });

      return {
        postURL: url,
        formData: headers,
        objectName: key
      };
    } catch (error) {
      logger.error('Failed to generate Upload Presigned URL', { error });
      return Promise.reject(`Failed to generate Upload Presigned URL: ${getErrText(error)}`);
    }
  };

  public async getFiles(prefix: string): Promise<string[]> {
    if (prefix.startsWith('/')) {
      prefix = prefix.slice(1);
    }

    const listResponse = await this.client.listObjects({ prefix });

    return listResponse.keys;
  }

  public removeFiles(objectNames: string[]) {
    return this.client.deleteObjectsByMultiKeys({ keys: objectNames });
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
          logger.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
          return Promise.reject(err);
        }
      );
      return filepath;
    } catch (err: any) {
      await rm(filepath);
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

      logger.info(`Starting move operation from ${normalizedSrcPath} to ${normalizedDistPath}`);

      // Get all objects in source directory
      const sourceObjects = await this.getFiles(normalizedSrcPath);

      if (sourceObjects.length === 0) {
        logger.warn(`No objects found in source directory: ${normalizedSrcPath}`);
        return;
      }

      logger.info(`Found ${sourceObjects.length} objects to move`);

      // Prepare copy operations
      const copyPromises = sourceObjects.map(async (sourceObjectName) => {
        // Extract the relative path from source directory
        const relativePath = sourceObjectName.replace(normalizedSrcPath, '');
        const destinationObjectName = `${normalizedDistPath}${relativePath}`;

        await this.client.copyObjectInSelfBucket({
          sourceKey: sourceObjectName,
          targetKey: destinationObjectName
        });

        logger.debug(`Copied: ${sourceObjectName} -> ${destinationObjectName}`);
        return { sourceObjectName, destinationObjectName };
      });

      // Execute all copy operations
      const copyResults = await Promise.all(copyPromises);
      logger.info(`Successfully copied ${copyResults.length} objects`);

      // Delete source objects after successful copy
      const sourceObjectNames = copyResults.map((result) => result.sourceObjectName);
      await this.removeFiles(sourceObjectNames);

      logger.info(
        `Successfully moved ${sourceObjectNames.length} objects from ${normalizedSrcPath} to ${normalizedDistPath}`
      );
    } catch (error) {
      const errorMsg = getErrText(error);
      logger.error(`Failed to move files from ${srcPath} to ${distPath}: ${errorMsg}`);
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

      logger.info(
        `Starting single file move operation from ${normalizedSrcName} to ${normalizedDistName}`
      );

      // Check if source object exists
      try {
        await this.client.checkObjectExists({ key: normalizedSrcName });
      } catch {
        return Promise.reject(new Error(`Source object not found: ${normalizedSrcName}`));
      }

      // Copy object to destination
      await this.client.copyObjectInSelfBucket({
        targetKey: normalizedDistName,
        sourceKey: normalizedSrcName
      });

      logger.debug(`Copied: ${normalizedSrcName} -> ${normalizedDistName}`);

      // Delete source object after successful copy
      await this.client.deleteObject({ key: normalizedSrcName });

      logger.info(`Successfully moved file from ${normalizedSrcName} to ${normalizedDistName}`);
    } catch (error) {
      const errorMsg = getErrText(error);
      logger.error(`Failed to move file from ${srcObjectName} to ${distObjectName}: ${errorMsg}`);
      return Promise.reject(error);
    }
  }
}

const getConfig = () => {
  const { vendor, externalBaseUrl, publicBucket, privateBucket, credentials, region, ...options } =
    createDefaultStorageOptions();

  const buildResult = <T extends StorageConfigWithoutBucket>(config: T, externalConfig?: T) => ({
    vendor,
    config,
    externalConfig,
    externalBaseUrl,
    privateBucket,
    publicBucket
  });

  if (vendor === 'minio' || vendor === 'aws-s3') {
    const config: Omit<IAwsS3CompatibleStorageOptions, 'bucket'> = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!,
      forcePathStyle: options.forcePathStyle,
      publicAccessExtraSubPath: options.publicAccessExtraSubPath
    };

    return buildResult(config, { ...config, endpoint: externalBaseUrl });
  }

  if (vendor === 'cos') {
    const config: Omit<ICosStorageOptions, 'bucket'> = {
      region,
      vendor,
      credentials,
      proxy: options.proxy,
      domain: options.domain,
      protocol: options.protocol,
      useAccelerate: options.useAccelerate
    };

    return buildResult(config);
  }

  if (vendor === 'oss') {
    const config: Omit<IOssStorageOptions, 'bucket'> = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      cname: options.cname,
      internal: options.internal,
      secure: options.secure,
      enableProxy: options.enableProxy
    };

    return buildResult(config);
  }

  throw new Error(`Not supported vendor: ${vendor}`);
};

const createS3Service = (bucket: string) => {
  const { config, externalConfig, externalBaseUrl } = getConfig();

  const client = createStorage({ bucket, ...config } as IStorageOptions);

  let externalClient: IStorage | undefined;
  if (externalBaseUrl && externalConfig) {
    externalClient = createStorage({ bucket, ...externalConfig } as IStorageOptions);
  }

  return { client, externalClient };
};

export class S3PublicService extends S3Service {
  private static instance: S3PublicService;

  private constructor() {
    const { publicBucket } = getConfig();
    const { client, externalClient } = createS3Service(publicBucket);
    super(client, externalClient);
  }

  public static getInstance(): S3PublicService {
    if (!S3PublicService.instance) {
      S3PublicService.instance = new S3PublicService();
    }
    return S3PublicService.instance;
  }

  async checkHealth(): Promise<void> {
    await super.checkHealth();
    try {
      if (this.externalClient instanceof MinioStorageAdapter) {
        await this.externalClient.ensurePublicBucketPolicy();
      }
    } catch (error) {
      logger.warn(
        `Failed to ensure public policy for ${this.externalClient.constructor.name}: ${error}`
      );
    }
  }
}

export class S3PrivateService extends S3Service {
  private static instance: S3PrivateService;

  public static getInstance(): S3PrivateService {
    if (!S3PrivateService.instance) {
      S3PrivateService.instance = new S3PrivateService();
    }
    return S3PrivateService.instance;
  }

  private constructor() {
    const { privateBucket } = getConfig();
    const { client, externalClient } = createS3Service(privateBucket);
    super(client, externalClient);
  }
}
