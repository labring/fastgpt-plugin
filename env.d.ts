declare namespace NodeJS {
  interface ProcessEnv {
    MINIO_CUSTOM_ENDPOINT: string;
    MINIO_ENDPOINT: string;
    MINIO_PORT: string;
    MINIO_USE_SSL: string;
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    MINIO_BUCKET: string;
    MAX_FILE_SIZE: string;
    RETENTION_DAYS: string;
  }
}
