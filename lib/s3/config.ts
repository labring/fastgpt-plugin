import { z } from 'zod';
import type { ClientOptions } from 'minio';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

export type S3ConfigType = {
  maxFileSize?: number; // 文件大小限制（字节）
  externalBaseURL?: string; // 自定义域名
  bucket: string; // 存储桶名称
  isPublicRead: boolean;
} & ClientOptions;

export const commonS3Config: Partial<S3ConfigType> = {
  endPoint: process.env.S3_ENDPOINT || 'localhost',
  port: process.env.S3_PORT ? parseInt(process.env.S3_PORT) : 9000,
  useSSL: process.env.S3_USE_SSL === 'true',
  accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  transportAgent: process.env.HTTP_PROXY
    ? new HttpProxyAgent(process.env.HTTP_PROXY)
    : process.env.HTTPS_PROXY
      ? new HttpsProxyAgent(process.env.HTTPS_PROXY)
      : undefined
} as const;

export const FileMetadataSchema = z.object({
  originalFilename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadTime: z.date(),
  accessUrl: z.string(),
  objectName: z.string()
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;
