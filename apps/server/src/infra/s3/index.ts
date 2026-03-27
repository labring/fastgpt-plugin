import {
  createStorage,
  MinioStorageAdapter,
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions,
  type IStorage,
  type IStorageOptions
} from '@fastgpt-sdk/storage';
import { createDefaultStorageOptions } from './config';
import { failureResult, successResult } from '@fastgpt-plugin/domain/value-objects/result.vo';

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

const createS3Service = (bucket: string) => {
  const { config, externalConfig, externalBaseUrl } = getConfig();

  const internalClient = createStorage({ bucket, ...config } as IStorageOptions);

  let externalClient: IStorage | undefined;
  if (externalBaseUrl && externalConfig) {
    externalClient = createStorage({ bucket, ...externalConfig } as IStorageOptions);
  }

  return { internalClient, externalClient };
};

export const createS3Clients = async () => {
  const { privateBucket, publicBucket } = getConfig();
  const privateClients = createS3Service(privateBucket);
  const publicClients = createS3Service(publicBucket);

  try {
    await privateClients.internalClient.ensureBucket();
    await publicClients.internalClient.ensureBucket();

    if (publicClients.internalClient instanceof MinioStorageAdapter) {
      await publicClients.internalClient.ensurePublicBucketPolicy();
    }
  } catch (e) {
    return failureResult('Connect S3 Error', e);
  }

  return successResult({
    privateClients,
    publicClients
  });
};
