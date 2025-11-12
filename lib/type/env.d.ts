declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    AUTH_TOKEN: string;
    LOG_LEVEL: string;
    MODEL_PROVIDER_PRIORITY: string;
    SIGNOZ_BASE_URL: string;
    SIGNOZ_SERVICE_NAME: string;
    MONGODB_URI: string;
    REDIS_URL: string;
    SERVICE_REQUEST_MAX_CONTENT_LENGTH: string;
    MAX_API_SIZE: string;
    DISABLE_DEV_TOOLS: string;
    S3_PRIVATE_BUCKET: string;
    S3_PUBLIC_BUCKET: string;
    S3_EXTERNAL_BASE_URL: string;
    S3_ENDPOINT: string;
    S3_PORT: string;
    S3_USE_SSL: string;
    S3_ACCESS_KEY: string;
    S3_SECRET_KEY: string;
    MAX_FILE_SIZE: string;
  }
}
