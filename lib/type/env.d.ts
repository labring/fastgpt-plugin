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
    MAX_FILE_SIZE: string;
  }
}
