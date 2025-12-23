import { createDefaultStorageOptions } from '@/s3/config';
import { S3Service } from './controller';
import {
  createStorage,
  MinioStorageAdapter,
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions,
  type IStorage
} from '@fastgpt-sdk/storage';

let config: any = {};
let externalConfig: any = {};

const { vendor, publicBucket, privateBucket, externalBaseUrl, credentials, region, ...options } =
  createDefaultStorageOptions();

const setConfig = () => {
  if (vendor === 'minio') {
    config = {
      region,
      vendor,
      credentials,
      forcePathStyle: true,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!
    } as Omit<IAwsS3CompatibleStorageOptions, 'bucket'>;
    externalConfig = {
      ...config,
      endpoint: externalBaseUrl
    };
  } else if (vendor === 'aws-s3') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      maxRetries: options.maxRetries!,
      forcePathStyle: options.forcePathStyle
    } as Omit<IAwsS3CompatibleStorageOptions, 'bucket'>;
    externalConfig = {
      ...config,
      endpoint: externalBaseUrl
    };
  } else if (vendor === 'cos') {
    config = {
      region,
      vendor,
      credentials,
      proxy: options.proxy,
      domain: options.domain,
      protocol: options.protocol,
      useAccelerate: options.useAccelerate
    } as Omit<ICosStorageOptions, 'bucket'>;
  } else if (vendor === 'oss') {
    config = {
      region,
      vendor,
      credentials,
      endpoint: options.endpoint!,
      cname: options.cname,
      internal: options.internal,
      secure: options.secure,
      enableProxy: options.enableProxy
    } as Omit<IOssStorageOptions, 'bucket'>;
  }
};

export const publicS3Server = (() => {
  if (!global._publicS3Server) {
    setConfig();

    const client = createStorage({ bucket: publicBucket, ...config });

    let externalClient: IStorage | undefined = undefined;
    if (externalBaseUrl) {
      externalClient = createStorage({ bucket: publicBucket, ...externalConfig });
    }

    global._publicS3Server = new S3Service(client, externalClient);

    client.ensureBucket();
    if (externalClient) {
      externalClient.ensureBucket();
    }

    client.ensureBucket().then(() => {
      if (vendor !== 'minio') return;
      (client as MinioStorageAdapter).ensurePublicBucketPolicy();
    });

    if (externalClient) {
      externalClient.ensureBucket().then(() => {
        if (vendor !== 'minio') return;
        (externalClient as MinioStorageAdapter).ensurePublicBucketPolicy();
      });
    }
  }
  return global._publicS3Server;
})();

export const privateS3Server = (() => {
  if (!global._privateS3Server) {
    setConfig();

    const client = createStorage({ bucket: privateBucket, ...config });

    let externalClient: IStorage | undefined = undefined;
    if (externalBaseUrl) {
      externalClient = createStorage({ bucket: privateBucket, ...externalConfig });
    }

    global._privateS3Server = new S3Service(client, externalClient);

    client.ensureBucket();
    if (externalClient) {
      externalClient.ensureBucket();
    }
  }
  return global._privateS3Server;
})();

declare global {
  var _publicS3Server: S3Service;
  var _privateS3Server: S3Service;
}
