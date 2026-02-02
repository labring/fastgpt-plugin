import { createDefaultStorageOptions } from '@/s3/config';
import { S3Service } from './controller';
import {
  createStorage,
  MinioStorageAdapter,
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions,
  type IStorage,
  type IStorageOptions
} from '@fastgpt-sdk/storage';
import { getLogger, infra } from '@/logger';

const logger = getLogger(infra.storage);

type StorageConfigWithoutBucket = Omit<IStorageOptions, 'bucket'>;

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

const createS3Service = async (bucket: string, isPublic: boolean) => {
  const { config, externalConfig, externalBaseUrl } = getConfig();

  const client = createStorage({ bucket, ...config } as IStorageOptions);

  let externalClient: IStorage | undefined;
  if (externalBaseUrl && externalConfig) {
    externalClient = createStorage({ bucket, ...externalConfig } as IStorageOptions);
  }

  const ensurePublicPolicy = async (storage: IStorage) => {
    if (storage instanceof MinioStorageAdapter) {
      await storage.ensurePublicBucketPolicy();
    }
  };

  await client.ensureBucket();
  if (isPublic) await ensurePublicPolicy(client);

  await externalClient?.ensureBucket();
  if (isPublic && externalClient) await ensurePublicPolicy(externalClient);

  return new S3Service(client, externalClient);
};

declare global {
  var _publicS3Server: S3Service;
  var _privateS3Server: S3Service;
}

export const initS3Service = async () => {
  const logger = getLogger(infra.storage);
  logger.info('Initializing S3 service...');
  const { publicBucket, privateBucket } = getConfig();

  try {
    if (!globalThis._publicS3Server) {
      logger.debug('Initializing public S3 service...');
      globalThis._publicS3Server = await createS3Service(publicBucket, true);
    }

    if (!globalThis._privateS3Server) {
      logger.debug('Initializing private S3 service...');
      globalThis._privateS3Server = await createS3Service(privateBucket, false);
    }
  } catch (e) {
    logger.error('Failed to initialize S3 service:', { error: e });
    throw new Error('Failed to initialize S3 service');
  }
};

export const publicS3Server = globalThis._publicS3Server;
export const privateS3Server = globalThis._privateS3Server;
