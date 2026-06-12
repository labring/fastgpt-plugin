import os from 'node:os';
import path from 'node:path';

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

const GatewayAuthTokenSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (process.env.NODE_ENV !== 'production') {
      return value || process.env.AUTH_TOKEN || DEV_AUTH_TOKEN;
    }

    const token = value;
    if (!token) {
      ctx.addIssue({
        code: 'custom',
        message: 'CONNECTION_GATEWAY_AUTH_TOKEN is required in production'
      });
    } else if (
      token.length < MIN_PRODUCTION_AUTH_TOKEN_LENGTH ||
      WEAK_AUTH_TOKENS.has(token.toLowerCase())
    ) {
      ctx.addIssue({
        code: 'custom',
        message: `CONNECTION_GATEWAY_AUTH_TOKEN must be at least ${MIN_PRODUCTION_AUTH_TOKEN_LENGTH} characters and not use a default value in production`
      });
    }

    return token;
  });

const createValidatedEnv = <TOutput>(schema: z.ZodRawShape): TOutput => {
  const result = z.object(schema).safeParse(normalizeRuntimeEnv(process.env));
  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path).join(', ');
    throw new Error(`Invalid environment variables. Please check: ${paths}\n`);
  }

  return result.data as TOutput;
};

const createLazyValidatedEnv = <TOutput extends object>(schema: z.ZodRawShape): TOutput => {
  let cachedEnv: TOutput | undefined;
  const getEnv = () => (cachedEnv ??= createValidatedEnv<TOutput>(schema));

  return new Proxy(
    {},
    {
      get(_target, property) {
        return Reflect.get(getEnv(), property);
      },
      has(_target, property) {
        return property in getEnv();
      },
      ownKeys() {
        return Reflect.ownKeys(getEnv());
      },
      getOwnPropertyDescriptor(_target, property) {
        return Reflect.getOwnPropertyDescriptor(getEnv(), property);
      }
    }
  ) as TOutput;
};

function normalizeRuntimeEnv(runtimeEnv: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(runtimeEnv).map(([key, value]) => [key, value === '' ? undefined : value])
  );
}

const NodeEnvSchema = z.enum(['development', 'production', 'test']).default('development');

const CommonEnvSchema = {
  NODE_ENV: NodeEnvSchema,

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
  LOG_CONSOLE_LEVEL: z.enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal']).default('info'),
  LOG_ENABLE_OTEL: BoolStringSchema.default(false),
  LOG_OTEL_LEVEL: z.enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal']).default('info'),
  LOG_OTEL_SERVICE_NAME: z.string().default('fastgpt-plugin'),
  LOG_OTEL_URL: z.url().default('http://localhost:4318/v1/logs'),

  // 指标
  METRICS_ENABLE_OTEL: BoolStringSchema.default(false),
  METRICS_OTEL_SERVICE_NAME: z.string().default('fastgpt-plugin'),
  METRICS_OTEL_URL: z.url().default('http://localhost:4318/v1/metrics'),
  METRICS_EXPORT_INTERVAL_MS: PositiveIntSchema.default(30_000),
  METRICS_EXPORT_TIMEOUT_MS: PositiveIntSchema.default(10_000),
  METRICS_INCLUDE_PLUGIN_VERSION: BoolStringSchema.default(true),
  METRICS_INCLUDE_PLUGIN_ETAG: BoolStringSchema.default(false),
  METRICS_INCLUDE_HOSTNAME: BoolStringSchema.default(true),
  SERVICE_INSTANCE_ID: z.string().optional(),
  DEPLOYMENT_ENVIRONMENT: z.string().optional()
};

const ServerEnvSchema = {
  ...CommonEnvSchema,

  // 服务器配置
  PORT: PositiveIntSchema.min(1024).max(65535).default(3000),
  AUTH_TOKEN: AuthTokenSchema,
  JWT_SECRET: z.string().default('fastgpt-plugin-secret'),

  // Connection Gateway client 配置
  CONNECTION_GATEWAY_BASE_URL: z.url().default('http://localhost:3010'),
  CONNECTION_GATEWAY_AUTH_TOKEN: GatewayAuthTokenSchema,
  CONNECTION_GATEWAY_DEBUG_REQUEST_TIMEOUT_MS: PositiveIntSchema.default(120_000),

  // 安全配置
  ALLOWED_INSTALL_HOSTS: z.string().optional(),
  DISABLE_SSRF_CHECK: BoolStringSchema.default(false),

  // 插件运行配置
  PLUGIN_RUNTIME_MODE: PluginRuntimeModeSchema.default(PluginRuntimeModeEnum['localPool']),

  // 进程池配置（插件级配置可被 MongoDB 中的 pluginConfig 覆盖）
  POOL_HEALTH_CHECK_INTERVAL: PositiveIntSchema.default(30_000),
  POOL_MAX_TOTAL_PODS: PositiveIntSchema.default(100),
  POOL_SERVICE_MIN_PODS: z.coerce.number().int().min(0).default(0),
  POOL_SERVICE_MAX_PODS: PositiveIntSchema.default(5),
  POOL_SERVICE_IDLE_TIMEOUT: PositiveIntSchema.default(60_000),
  POOL_SERVICE_POD_TIMEOUT: PositiveIntSchema.default(120_000),
  POOL_SERVICE_MAX_CONCURRENT_REQUESTS_PER_POD: PositiveIntSchema.default(10),
  POOL_SERVICE_MAX_REQUESTS_PER_POD: PositiveIntSchema.default(100),
  POOL_SERVICE_MAX_QUEUE_SIZE: PositiveIntSchema.default(500),
  POOL_SERVICE_QUEUE_TIMEOUT: PositiveIntSchema.default(60_000),
  POOL_SERVICE_STARTUP_RETRY_BASE_DELAY: PositiveIntSchema.default(1_000),
  POOL_SERVICE_STARTUP_RETRY_MAX_DELAY: PositiveIntSchema.default(10_000),

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
  MODEL_CHANNEL_PRIORITY: z.string().default(''),
  MAX_FILE_SIZE: PositiveIntSchema.default(20 * 1024 * 1024),

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
  STORAGE_COS_PROTOCOL: z.enum(['https:', 'http:']).default('https:'),
  STORAGE_COS_USE_ACCELERATE: BoolStringSchema.default(false),
  STORAGE_COS_CNAME_DOMAIN: z.string().optional(),
  STORAGE_COS_PROXY: z.string().optional(),
  STORAGE_OSS_ENDPOINT: z.url().optional(),
  STORAGE_OSS_INTERNAL: BoolStringSchema.default(false),
  STORAGE_OSS_SECURE: BoolStringSchema.default(true),
  STORAGE_OSS_ENABLE_PROXY: BoolStringSchema.default(false),
  STORAGE_OSS_CNAME: BoolStringSchema.default(false)
};

const GatewayEnvSchema = {
  ...CommonEnvSchema,

  // Connection Gateway 服务配置
  CONNECTION_GATEWAY_PORT: PositiveIntSchema.min(1024).max(65535).default(3010),
  CONNECTION_GATEWAY_TCP_PORT: PositiveIntSchema.min(1024).max(65535).default(3011),
  CONNECTION_GATEWAY_NODE_ID: z.string().optional(),
  CONNECTION_GATEWAY_SESSION_TTL_MS: PositiveIntSchema.default(60_000),
  CONNECTION_GATEWAY_OWNER_LEASE_TTL_MS: PositiveIntSchema.default(15_000),
  CONNECTION_GATEWAY_MAILBOX_MAXLEN: PositiveIntSchema.default(1_000),
  CONNECTION_GATEWAY_MAILBOX_BLOCK_MS: PositiveIntSchema.default(5_000),
  CONNECTION_GATEWAY_MAX_CONNECTIONS: PositiveIntSchema.default(5_000),
  CONNECTION_GATEWAY_MAX_SESSIONS_PER_SUBJECT: PositiveIntSchema.default(5),
  CONNECTION_GATEWAY_MAX_IN_FLIGHT_PER_SESSION: PositiveIntSchema.default(50),
  CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES: PositiveIntSchema.default(1024 * 1024),
  CONNECTION_GATEWAY_SLOW_CONSUMER_BUFFER_BYTES: PositiveIntSchema.default(8 * 1024 * 1024),

  // 认证配置
  AUTH_TOKEN: AuthTokenSchema,
  JWT_SECRET: z.string().default('fastgpt-plugin-secret')
};

export type ServerEnv = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  AUTH_TOKEN: string;
  JWT_SECRET: string;
  CONNECTION_GATEWAY_BASE_URL: string;
  CONNECTION_GATEWAY_AUTH_TOKEN: string;
  CONNECTION_GATEWAY_DEBUG_REQUEST_TIMEOUT_MS: number;
  HTTP_PROXY?: string;
  HTTPS_PROXY?: string;
  NO_PROXY?: string;
  ALL_PROXY?: string;
  MONGODB_URI: string;
  MONGO_MAX_LINK: number;
  SYNC_INDEX: boolean;
  REDIS_URL: string;
  LOG_ENABLE_CONSOLE: boolean;
  LOG_CONSOLE_LEVEL: 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  LOG_ENABLE_OTEL: boolean;
  LOG_OTEL_LEVEL: 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  LOG_OTEL_SERVICE_NAME: string;
  LOG_OTEL_URL: string;
  METRICS_ENABLE_OTEL: boolean;
  METRICS_OTEL_SERVICE_NAME: string;
  METRICS_OTEL_URL: string;
  METRICS_EXPORT_INTERVAL_MS: number;
  METRICS_EXPORT_TIMEOUT_MS: number;
  METRICS_INCLUDE_PLUGIN_VERSION: boolean;
  METRICS_INCLUDE_PLUGIN_ETAG: boolean;
  METRICS_INCLUDE_HOSTNAME: boolean;
  SERVICE_INSTANCE_ID?: string;
  DEPLOYMENT_ENVIRONMENT?: string;
  ALLOWED_INSTALL_HOSTS?: string;
  DISABLE_SSRF_CHECK: boolean;
  PLUGIN_RUNTIME_MODE: 'localPool' | 'serverless';
  POOL_HEALTH_CHECK_INTERVAL: number;
  POOL_MAX_TOTAL_PODS: number;
  POOL_SERVICE_MIN_PODS: number;
  POOL_SERVICE_MAX_PODS: number;
  POOL_SERVICE_IDLE_TIMEOUT: number;
  POOL_SERVICE_POD_TIMEOUT: number;
  POOL_SERVICE_MAX_CONCURRENT_REQUESTS_PER_POD: number;
  POOL_SERVICE_MAX_REQUESTS_PER_POD: number;
  POOL_SERVICE_MAX_QUEUE_SIZE: number;
  POOL_SERVICE_QUEUE_TIMEOUT: number;
  POOL_SERVICE_STARTUP_RETRY_BASE_DELAY: number;
  POOL_SERVICE_STARTUP_RETRY_MAX_DELAY: number;
  LOCAL_FILE_BASE_PATH: string;
  S3_FILE_BASE_PATH: string;
  HOSTNAME?: string;
  MAX_API_SIZE: number;
  FASTGPT_BASE_URL: string;
  SERVICE_REQUEST_MAX_CONTENT_LENGTH: number;
  DISABLE_CACHE: boolean;
  MODEL_PROVIDER_PRIORITY: string;
  MODEL_CHANNEL_PRIORITY: string;
  MAX_FILE_SIZE: number;
  STORAGE_VENDOR: 'minio' | 'aws-s3' | 'cos' | 'oss';
  STORAGE_REGION: string;
  STORAGE_ACCESS_KEY_ID: string;
  STORAGE_SECRET_ACCESS_KEY: string;
  STORAGE_PUBLIC_BUCKET: string;
  STORAGE_PRIVATE_BUCKET: string;
  STORAGE_EXTERNAL_ENDPOINT: string;
  STORAGE_S3_ENDPOINT: string;
  STORAGE_S3_FORCE_PATH_STYLE: boolean;
  STORAGE_S3_MAX_RETRIES: number;
  STORAGE_PUBLIC_ACCESS_EXTRA_SUB_PATH?: string;
  STORAGE_COS_PROTOCOL: 'https:' | 'http:';
  STORAGE_COS_USE_ACCELERATE: boolean;
  STORAGE_COS_CNAME_DOMAIN?: string;
  STORAGE_COS_PROXY?: string;
  STORAGE_OSS_ENDPOINT?: string;
  STORAGE_OSS_INTERNAL: boolean;
  STORAGE_OSS_SECURE: boolean;
  STORAGE_OSS_ENABLE_PROXY: boolean;
  STORAGE_OSS_CNAME: boolean;
};

export type GatewayEnv = Pick<
  ServerEnv,
  | 'NODE_ENV'
  | 'HTTP_PROXY'
  | 'HTTPS_PROXY'
  | 'NO_PROXY'
  | 'ALL_PROXY'
  | 'MONGODB_URI'
  | 'MONGO_MAX_LINK'
  | 'SYNC_INDEX'
  | 'REDIS_URL'
  | 'LOG_ENABLE_CONSOLE'
  | 'LOG_CONSOLE_LEVEL'
  | 'LOG_ENABLE_OTEL'
  | 'LOG_OTEL_LEVEL'
  | 'LOG_OTEL_SERVICE_NAME'
  | 'LOG_OTEL_URL'
  | 'METRICS_ENABLE_OTEL'
  | 'METRICS_OTEL_SERVICE_NAME'
  | 'METRICS_OTEL_URL'
  | 'METRICS_EXPORT_INTERVAL_MS'
  | 'METRICS_EXPORT_TIMEOUT_MS'
  | 'METRICS_INCLUDE_PLUGIN_VERSION'
  | 'METRICS_INCLUDE_PLUGIN_ETAG'
  | 'METRICS_INCLUDE_HOSTNAME'
  | 'SERVICE_INSTANCE_ID'
  | 'DEPLOYMENT_ENVIRONMENT'
  | 'AUTH_TOKEN'
  | 'JWT_SECRET'
> & {
  CONNECTION_GATEWAY_PORT: number;
  CONNECTION_GATEWAY_TCP_PORT: number;
  CONNECTION_GATEWAY_NODE_ID?: string;
  CONNECTION_GATEWAY_SESSION_TTL_MS: number;
  CONNECTION_GATEWAY_OWNER_LEASE_TTL_MS: number;
  CONNECTION_GATEWAY_MAILBOX_MAXLEN: number;
  CONNECTION_GATEWAY_MAILBOX_BLOCK_MS: number;
  CONNECTION_GATEWAY_MAX_CONNECTIONS: number;
  CONNECTION_GATEWAY_MAX_SESSIONS_PER_SUBJECT: number;
  CONNECTION_GATEWAY_MAX_IN_FLIGHT_PER_SESSION: number;
  CONNECTION_GATEWAY_MAX_ENVELOPE_BYTES: number;
  CONNECTION_GATEWAY_SLOW_CONSUMER_BUFFER_BYTES: number;
};

export const serverEnv: ServerEnv = createLazyValidatedEnv<ServerEnv>(ServerEnvSchema);
export const gatewayEnv: GatewayEnv = createLazyValidatedEnv<GatewayEnv>(GatewayEnvSchema);

export const env: ServerEnv = serverEnv;
