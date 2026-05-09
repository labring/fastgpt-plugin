import os from 'node:os';
import path from 'node:path';

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { BoolStringSchema, PositiveIntSchema } from '@domain/value-objects/baisc.vo';
import { PluginRuntimeModeEnum, PluginRuntimeModeSchema } from '@domain/value-objects/plugin.vo';

const DEV_AUTH_TOKEN = 'token';
const MIN_PRODUCTION_AUTH_TOKEN_LENGTH = 32;
const WEAK_AUTH_TOKENS = new Set(['token', 'changeme', 'password', 'secret', 'default']);

const AuthTokenSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    const token = value || DEV_AUTH_TOKEN;

    if (process.env.NODE_ENV !== 'production') {
      return token;
    }

    if (!value) {
      ctx.addIssue({
        code: 'custom',
        message: 'AUTH_TOKEN is required in production'
      });
    } else if (
      token.length < MIN_PRODUCTION_AUTH_TOKEN_LENGTH ||
      WEAK_AUTH_TOKENS.has(token.toLowerCase())
    ) {
      ctx.addIssue({
        code: 'custom',
        message: `AUTH_TOKEN must be at least ${MIN_PRODUCTION_AUTH_TOKEN_LENGTH} characters and not use a default value in production`
      });
    }

    return token;
  });

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
  onValidationError(issues) {
    const paths = issues.map((issue) => issue.path).join(', ');
    throw new Error(`Invalid environment variables. Please check: ${paths}\n`);
  },
  server: {
    // 基础配置
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // 服务器配置
    PORT: PositiveIntSchema.min(1024).max(65535).default(3000),
    AUTH_TOKEN: AuthTokenSchema,
    JWT_SECRET: z.string().default('fastgpt-plugin-secret'),

    // 安全配置
    ALLOWED_INSTALL_HOSTS: z.string().optional(),
    DISABLE_SSRF_CHECK: BoolStringSchema.default(false),

    // 插件运行配置
    PLUGIN_RUNTIME_MODE: PluginRuntimeModeSchema.default(PluginRuntimeModeEnum['localPool']),

    // 进程池默认配置（可被 MongoDB 中的 pluginConfig 覆盖）
    // 进程池全局设置
    POOL_HEALTH_CHECK_INTERVAL: PositiveIntSchema.default(30_000), // 健康检查时间 (ms)
    POOL_MAX_TOTAL_PODS: PositiveIntSchema.default(100), // 最大总进程数
    POOL_SERVICE_MIN_PODS: z.coerce.number().int().min(0).default(0), // 某个 Service 的最小进程数
    POOL_SERVICE_MAX_PODS: PositiveIntSchema.default(5), // 某个 Service 的最大进程数
    POOL_SERVICE_IDLE_TIMEOUT: PositiveIntSchema.default(60_000), // 空闲超时时间 (ms)
    POOL_SERVICE_POD_TIMEOUT: PositiveIntSchema.default(30_000), // 进程运行超时时间 (ms)
    POOL_SERVICE_MAX_CONCURRENT_REQUESTS_PER_POD: PositiveIntSchema.default(1), // 单个进程最大并发请求数
    POOL_SERVICE_MAX_REQUESTS_PER_POD: PositiveIntSchema.default(100), // 单个进程最大请求数,超出后自动进行自动轮换
    POOL_SERVICE_MAX_QUEUE_SIZE: PositiveIntSchema.default(500), // 进程队列最大长度
    POOL_SERVICE_QUEUE_TIMEOUT: PositiveIntSchema.default(60_000), // 进程队列超时时间 (ms)

    // 基础设施配置
    // 文件存储配置
    LOCAL_FILE_BASE_PATH: z.string().default(path.join(os.tmpdir(), 'fastgpt-plugin')),
    S3_FILE_BASE_PATH: z.string().default('system/plugin'),

    // 系统
    HOSTNAME: z.string().optional(),
    MAX_API_SIZE: PositiveIntSchema.default(10),
    FASTGPT_BASE_URL: z.url().default('http://localhost:3000'),
    SERVICE_REQUEST_MAX_CONTENT_LENGTH: PositiveIntSchema.default(10),
    DISABLE_CACHE: BoolStringSchema.default(false),
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
    SYNC_INDEX: BoolStringSchema.default(true),
    REDIS_URL: z.string().nonempty().default('redis://default:password@localhost:6379/0'),

    // 日志
    LOG_ENABLE_CONSOLE: BoolStringSchema.default(true),
    LOG_CONSOLE_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal'])
      .default('info'),
    LOG_ENABLE_OTEL: BoolStringSchema.default(false),
    LOG_OTEL_LEVEL: z.enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal']).default('info'),
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
    STORAGE_S3_FORCE_PATH_STYLE: BoolStringSchema.default(true),
    STORAGE_S3_MAX_RETRIES: PositiveIntSchema.default(3),
    STORAGE_PUBLIC_ACCESS_EXTRA_SUB_PATH: z.string().optional(),

    // 可选的对象存储配置
    // COS | OSS
    STORAGE_COS_PROTOCOL: z.enum(['https:', 'http:']).default('https:'),
    STORAGE_COS_USE_ACCELERATE: BoolStringSchema.default(false),
    STORAGE_COS_CNAME_DOMAIN: z.string().optional(),
    STORAGE_COS_PROXY: z.string().optional(),
    STORAGE_OSS_ENDPOINT: z.url().optional(),
    STORAGE_OSS_INTERNAL: BoolStringSchema.default(false),
    STORAGE_OSS_SECURE: BoolStringSchema.default(true),
    STORAGE_OSS_ENABLE_PROXY: BoolStringSchema.default(false),
    STORAGE_OSS_CNAME: BoolStringSchema.default(false)
  }
});
