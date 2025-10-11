declare namespace NodeJS {
  interface ProcessEnv {
    S3_EXTERNAL_BASE_URL: string;
    S3_ENDPOINT: string;
    S3_PORT: string;
    S3_USE_SSL: string;
    S3_ACCESS_KEY: string;
    S3_SECRET_KEY: string;
    S3_BUCKET: string;
    MAX_FILE_SIZE: string;
    RETENTION_DAYS: string;
  }
}
