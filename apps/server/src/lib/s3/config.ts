import { z } from 'zod';
import {
  type IAwsS3CompatibleStorageOptions,
  type ICosStorageOptions,
  type IOssStorageOptions
} from '@fastgpt-sdk/storage';
import { getLogger, infra } from '@/logger';
import { env } from '@/env';

const logger = getLogger(infra.storage);

export const FileMetadataSchema = z.object({
  originalFilename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadTime: z.date(),
  accessUrl: z.string(),
  objectName: z.string()
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export function createDefaultStorageOptions() {
  const vendor = env.STORAGE_VENDOR;

  logger.debug(`Load configuration of '${vendor}' Vendor`);

  switch (vendor) {
    case 'minio': {
      return {
        vendor: 'minio',
        forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
        externalBaseUrl: env.STORAGE_EXTERNAL_ENDPOINT,
        endpoint: env.STORAGE_S3_ENDPOINT,
        region: env.STORAGE_REGION,
        publicBucket: env.STORAGE_PUBLIC_BUCKET,
        privateBucket: env.STORAGE_PRIVATE_BUCKET,
        credentials: {
          accessKeyId: env.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY
        },
        publicAccessExtraSubPath: env.STORAGE_PUBLIC_ACCESS_EXTRA_SUB_PATH,
        maxRetries: env.STORAGE_S3_MAX_RETRIES
      } satisfies Omit<IAwsS3CompatibleStorageOptions, 'bucket'> & {
        publicBucket: string;
        privateBucket: string;
        externalBaseUrl?: string;
      };
    }

    case 'aws-s3': {
      return {
        vendor: 'aws-s3',
        forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
        externalBaseUrl: env.STORAGE_EXTERNAL_ENDPOINT,
        endpoint: env.STORAGE_S3_ENDPOINT,
        region: env.STORAGE_REGION,
        publicBucket: env.STORAGE_PUBLIC_BUCKET,
        privateBucket: env.STORAGE_PRIVATE_BUCKET,
        credentials: {
          accessKeyId: env.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY
        },
        publicAccessExtraSubPath: env.STORAGE_PUBLIC_ACCESS_EXTRA_SUB_PATH || undefined,
        maxRetries: env.STORAGE_S3_MAX_RETRIES
      } satisfies Omit<IAwsS3CompatibleStorageOptions, 'bucket'> & {
        publicBucket: string;
        privateBucket: string;
        externalBaseUrl?: string;
      };
    }

    case 'cos': {
      return {
        vendor: 'cos',
        externalBaseUrl: env.STORAGE_EXTERNAL_ENDPOINT,
        region: env.STORAGE_REGION,
        publicBucket: env.STORAGE_PUBLIC_BUCKET,
        privateBucket: env.STORAGE_PRIVATE_BUCKET,
        credentials: {
          accessKeyId: env.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY
        },
        protocol: env.STORAGE_COS_PROTOCOL,
        useAccelerate: env.STORAGE_COS_USE_ACCELERATE,
        domain: env.STORAGE_COS_CNAME_DOMAIN,
        proxy: env.STORAGE_COS_PROXY
      } satisfies Omit<ICosStorageOptions, 'bucket'> & {
        publicBucket: string;
        privateBucket: string;
        externalBaseUrl?: string;
      };
    }

    case 'oss': {
      return {
        vendor: 'oss',
        externalBaseUrl: env.STORAGE_EXTERNAL_ENDPOINT,
        endpoint: env.STORAGE_OSS_ENDPOINT || '',
        region: env.STORAGE_REGION,
        publicBucket: env.STORAGE_PUBLIC_BUCKET,
        privateBucket: env.STORAGE_PRIVATE_BUCKET,
        credentials: {
          accessKeyId: env.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY
        },
        cname: env.STORAGE_OSS_CNAME,
        internal: env.STORAGE_OSS_INTERNAL,
        secure: env.STORAGE_OSS_SECURE,
        enableProxy: env.STORAGE_OSS_ENABLE_PROXY
      } satisfies Omit<IOssStorageOptions, 'bucket'> & {
        publicBucket: string;
        privateBucket: string;
        externalBaseUrl?: string;
      };
    }

    default: {
      throw new Error(`Unsupported storage vendor: ${vendor}`);
    }
  }
}
