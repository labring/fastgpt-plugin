import { z } from 'zod';
import { S3Service } from './controller';

export type FileConfig = {
  maxFileSize: number; // 文件大小限制（字节）
  retentionDays: number; // 保留天数（由 MinIO 生命周期策略自动管理）
  endpoint: string; // MinIO endpoint
  port?: number; // MinIO port
  useSSL: boolean; // 是否使用SSL
  accessKey: string; // MinIO access key
  secretKey: string; // MinIO secret key
  bucket: string; // 存储桶名称
};

// 默认配置（动态从环境变量读取）
export const defaultFileConfig: FileConfig = {
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 20 * 1024 * 1024, // 默认 20MB
  retentionDays: process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS) : 15, // 默认保留15天
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  bucket: process.env.MINIO_BUCKET || 'files'
};

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
  global.s3Server = new S3Service(defaultFileConfig);
  return global.s3Server.initialize();
};

declare global {
  var s3Server: S3Service;
}
