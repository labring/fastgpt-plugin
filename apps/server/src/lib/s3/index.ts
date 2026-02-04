import { getLogger, infra } from '../logger';
import { createDefaultStorageOptions } from './config';
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
    try {
      if (storage instanceof MinioStorageAdapter) {
        await storage.ensurePublicBucketPolicy();
      }
    } catch (error) {
      logger.warn(`Failed to ensure public policy for ${storage.constructor.name}: ${error}`);
    }
  };

  await client.ensureBucket();
  if (isPublic) await ensurePublicPolicy(client);

  await externalClient?.ensureBucket();
  if (isPublic && externalClient) await ensurePublicPolicy(externalClient);

  return new S3Service(client, externalClient);
};

const s3ServiceInstances: {
  public: S3Service | null;
  private: S3Service | null;
} = {
  public: null,
  private: null
};

export const initS3Service = async () => {
  const logger = getLogger(infra.storage);
  logger.info('Initializing S3 service...');
  const { publicBucket, privateBucket } = getConfig();

  try {
    if (!s3ServiceInstances.public) {
      logger.debug('Initializing public S3 service...');
      s3ServiceInstances.public = await createS3Service(publicBucket, true);
    }

    if (!s3ServiceInstances.private) {
      logger.debug('Initializing private S3 service...');
      s3ServiceInstances.private = await createS3Service(privateBucket, false);
    }
  } catch (e) {
    logger.error('Failed to initialize S3 service:', { error: e });
    throw new Error('Failed to initialize S3 service');
  }

  logger.info('S3 service initialized successfully');
};

export const getPublicS3Server = (): S3Service => {
  if (!s3ServiceInstances.public) {
    throw new Error('Public S3 service not initialized. Call initS3Service() first.');
  }
  return s3ServiceInstances.public;
};

export const getPrivateS3Server = (): S3Service => {
  if (!s3ServiceInstances.private) {
    throw new Error('Private S3 service not initialized. Call initS3Service() first.');
  }
  return s3ServiceInstances.private;
};

export const publicS3Server = new Proxy({} as S3Service, {
  get(_, prop) {
    return getPublicS3Server()[prop as keyof S3Service];
  }
});

export const privateS3Server = new Proxy({} as S3Service, {
  get(_, prop) {
    return getPrivateS3Server()[prop as keyof S3Service];
  }
});
