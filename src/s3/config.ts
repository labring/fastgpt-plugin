import { z } from 'zod';
import { S3Service } from './controller';
import type { ClientOptions } from 'minio';

export type S3ConfigType = {
  maxFileSize?: number; // 文件大小限制（字节）
  retentionDays?: number; // 保留天数（由 S3 生命周期策略自动管理）
  externalBaseUrl?: string; // 自定义域名
  bucket: string; // 存储桶名称
} & ClientOptions;

// 默认配置（动态从环境变量读取）
export const commonS3Config = {
  endPoint: process.env.S3_ENDPOINT || 'localhost',
  port: process.env.S3_PORT ? parseInt(process.env.S3_PORT) : 9000,
  useSSL: process.env.S3_USE_SSL === 'true',
  accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY || 'minioadmin'
} as const;

export const FileMetadataSchema = z.object({
  fileId: z.string(),
  originalFilename: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadTime: z.date(),
  accessUrl: z.string()
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const initS3Server = () => {
  global._fileUploadS3Server = new S3Service({
    ...commonS3Config,
    maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 20 * 1024 * 1024, // 默认 20MB
    retentionDays: process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS) : 15, // 默认保留15天
    bucket: process.env.S3_UPLOAD_BUCKET || 'public_read_bucket',
    externalBaseUrl: process.env.S3_EXTERNAL_BASE_URL
  });

  global._pluginFileS3Server = new S3Service({
    ...commonS3Config,
    maxFileSize: 50 * 1024 * 1024, // 默认 50MB,
    bucket: process.env.S3_PLUGIN_BUCKET || 'priviate_bucket'
  });

  return Promise.all([
    global._fileUploadS3Server.initialize(),
    global._pluginFileS3Server.initialize()
  ]);
};

declare global {
  var _fileUploadS3Server: S3Service;
  var _pluginFileS3Server: S3Service;
}

export const fileUploadS3Server = global._fileUploadS3Server;
export const pluginFileS3Server = global._pluginFileS3Server;
