import type { IStorage } from '@fastgpt-sdk/storage';

export interface S3Service {
  client: IStorage;
  externalClient: IStorage;
}
