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
      forcePathStyle: vendor === 'minio' ? true : options.forcePathStyle,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!
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

const createS3Service = (bucket: string, isPublic: boolean) => {
  const { config, externalConfig, externalBaseUrl } = getConfig();

  const client = createStorage({ bucket, ...config } as IStorageOptions);

  let externalClient: IStorage | undefined;
  if (externalBaseUrl && externalConfig) {
    externalClient = createStorage({ bucket, ...externalConfig } as IStorageOptions);
  }

  const ensurePublicPolicy = (storage: IStorage) => {
    if (storage instanceof MinioStorageAdapter) {
      storage.ensurePublicBucketPolicy();
    }
  };

  client.ensureBucket().then(() => {
    if (isPublic) ensurePublicPolicy(client);
  });

  if (externalClient) {
    externalClient.ensureBucket().then(() => {
      if (isPublic) ensurePublicPolicy(externalClient);
    });
  }

  return new S3Service(client, externalClient);
};

export const publicS3Server = (() => {
  if (!global._publicS3Server) {
    const { publicBucket } = getConfig();
    global._publicS3Server = createS3Service(publicBucket, true);
  }
  return global._publicS3Server;
})();

export const privateS3Server = (() => {
  if (!global._privateS3Server) {
    const { privateBucket } = getConfig();
    global._privateS3Server = createS3Service(privateBucket, false);
  }
  return global._privateS3Server;
})();

declare global {
  var _publicS3Server: S3Service;
  var _privateS3Server: S3Service;
}
