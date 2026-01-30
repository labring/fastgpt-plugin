import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const BoolSchema = z
  .string()
  .transform((val) => val === 'true')
  .pipe(z.boolean());
const PositiveIntSchema = z.coerce.number<number>().int().positive();

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
  onValidationError(issues) {
    const paths = issues.map((issue) => issue.path).join(', ');
    throw new Error(`Invalid environment variables. Please check: ${paths}\n`);
  },
  server: {
    // 系统
    NODE_ENV: z.string().default('development'),
    PORT: PositiveIntSchema.min(1024).max(65535).default(3000),
    AUTH_TOKEN: z.string().default(''),
    HOSTNAME: z.string().optional(),
    MAX_API_SIZE: PositiveIntSchema.default(10),
    FASTGPT_BASE_URL: z.url().default('http://localhost:3000'),
    SERVICE_REQUEST_MAX_CONTENT_LENGTH: PositiveIntSchema.default(10),
    MAX_WORKER: PositiveIntSchema.default(8),
    MAX_MEMORYMB: PositiveIntSchema.default(1024),
    DISABLE_DEV_TOOLS: BoolSchema.default(false),
    DISABLE_CACHE: BoolSchema.default(true),
    CHECK_INTERNAL_IP: BoolSchema.default(true),
    MODEL_PROVIDER_PRIORITY: z.string().default(''),
    MAX_FILE_SIZE: PositiveIntSchema.default(20 * 1024 * 1024),

    // 代理
    HTTP_PROXY: z.string().optional(),
    HTTPS_PROXY: z.string().optional(),
    NO_PROXY: z.string().optional(),
    ALL_PROXY: z.string().optional(),

    // 数据库
    MONGODB_URI: z
      .string()
      .nonempty()
      .default(
        'mongodb://username:password@localhost:27017/fastgpt?authSource=admin&directConnection=true'
      ),
    MONGO_MAX_LINK: PositiveIntSchema.default(20),
    SYNC_INDEX: BoolSchema.default(true),
    REDIS_URL: z.string().nonempty().default('redis://default:password@localhost:6379/0'),

    // 日志
    LOG_ENABLE_CONSOLE: BoolSchema.default(true),
    LOG_ENABLE_OTEL: BoolSchema.default(false),
    LOG_OTEL_SERVICE_NAME: z.string().default('fastgpt-plugin'),
    LOG_OTEL_URL: z.url().default('http://localhost:4318/v1/logs'),

    // 对象存储
    STORAGE_VENDOR: z.enum(['minio', 'aws-s3', 'cos', 'oss']).default('minio'),
    STORAGE_REGION: z.string().default('us-east-1'),
    STORAGE_ACCESS_KEY_ID: z.string().default('minioadmin'),
    STORAGE_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
    STORAGE_PUBLIC_BUCKET: z.string().default('fastgpt-public'),
    STORAGE_PRIVATE_BUCKET: z.string().default('fastgpt-private'),
    STORAGE_EXTERNAL_ENDPOINT: z.url().default('http://localhost:9000'),
    STORAGE_S3_ENDPOINT: z.url().default('http://localhost:9000'),
    STORAGE_S3_FORCE_PATH_STYLE: BoolSchema.default(true),
    STORAGE_S3_MAX_RETRIES: PositiveIntSchema.default(3),
    STORAGE_PUBLIC_ACCESS_EXTRA_SUB_PATH: z.string().optional(),

    // 可选的对象存储配置
    // COS | OSS
    STORAGE_COS_PROTOCOL: z.enum(['https:', 'http:']).default('https:'),
    STORAGE_COS_USE_ACCELERATE: BoolSchema.default(false),
    STORAGE_COS_CNAME_DOMAIN: z.string().optional(),
    STORAGE_COS_PROXY: z.string().optional(),
    STORAGE_OSS_ENDPOINT: z.url().optional(),
    STORAGE_OSS_INTERNAL: BoolSchema.default(false),
    STORAGE_OSS_SECURE: BoolSchema.default(true),
    STORAGE_OSS_ENABLE_PROXY: BoolSchema.default(false),
    STORAGE_OSS_CNAME: BoolSchema.default(false)
  }
});
