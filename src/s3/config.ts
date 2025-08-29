import { z } from 'zod';
import { S3Service } from './controller';
import type { ClientOptions } from 'minio';

export type S3ConfigType = {
  maxFileSize?: number; // 文件大小限制（字节）
  retentionDays?: number; // 保留天数（由 S3 生命周期策略自动管理）
  customEndpoint?: string; // 自定义域名
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
  global.fileUploadS3Server = new S3Service({
    ...commonS3Config,
    maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 20 * 1024 * 1024, // 默认 20MB
    retentionDays: process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS) : 15, // 默认保留15天
    bucket: process.env.S3_UPLOAD_BUCKET || process.env.S3_BUCKET || 'files',
    customEndpoint: process.env.S3_CUSTOM_ENDPOINT
  });

  global.pluginFileS3Server = new S3Service({
    ...commonS3Config,
    maxFileSize: 10 * 1024 * 1024, // 默认 10MB,
    bucket: process.env.S3_PLUGIN_BUCKET || process.env.S3_BUCKET || 'files'
  });

  return Promise.all([
    global.fileUploadS3Server.initialize(),
    global.pluginFileS3Server.initialize()
  ]);
};

declare global {
  var fileUploadS3Server: S3Service;
  var pluginFileS3Server: S3Service;
}
