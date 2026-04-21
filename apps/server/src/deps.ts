import path from 'node:path';

import { LocalPoolPluginRuntimeManager } from '@fastgpt-plugin/infrastructure/plugin/plugin-runtime/drivers/local-pool/local-pool-runtime.driver';
import { PluginPKFFileResolver } from '@fastgpt-plugin/infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';

import { env } from '@infrastructure/env';
import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { ToolManager } from '@infrastructure/plugin/tool.impl';
import { RedisClient } from '@infrastructure/redis/redis-client';
import { MongoClient } from '@infrastructure/storage/mongo/index';
import { createS3Clients } from '@infrastructure/storage/s3';
import { URLFileFetcher } from '@infrastructure/utils/url-file-fetcher';

import { createInvokeUploadFileHandler } from './invoke/upload-file.handler';

export const mongoClient = MongoClient.getInstance();
export const { privateClients: s3PrivateClients, publicClients: s3PublicClients } =
  createS3Clients();

export const localFileStorageRepo = LocalFileStorageRepo.getInstance();

export const privateRemoteFileStorageRepo = new RemoteFileStorageRepo({
  mongoClient,
  s3Clients: s3PrivateClients
});

export const publicRemoteFileStorageRepo = new RemoteFileStorageRepo({
  mongoClient,
  s3Clients: s3PublicClients
});

export const fileTTLManager = new FileTTLManager({
  mongoClient,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo
});

export const invokeUploadFileHandler = createInvokeUploadFileHandler({
  s3Clients: s3PublicClients,
  basePath: path.join(env.S3_FILE_BASE_PATH, 'invoke')
});

export const pluginRepo = PluginRepo.getInstance({
  localFileStorageRepo,
  mongoClient,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  fileTTLManager
});

export const pluginPKGFileResolver = new PluginPKFFileResolver({
  localFileStorageRepo,
  pluginRepo
});

export const urlFileFetcher = new URLFileFetcher();
export const redisClient = RedisClient.getInstance();

const localPoolPluginRuntimeManager = LocalPoolPluginRuntimeManager.getInstance({
  pluginRepo,
  mongoClient,
  redisClient
});

export const pluginRuntimeManager = localPoolPluginRuntimeManager;

export const toolManager = ToolManager.getInstance({
  pluginRepo,
  pluginRuntimeManager,
  uploadFileHandler: invokeUploadFileHandler
});

const deps = {
  localFileStorageRepo,
  pluginPKGFileResolver,
  urlFileFetcher,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  pluginRepo,
  mongoClient,
  fileTTLManager,
  invokeUploadFileHandler,
  toolManager,
  pluginRuntimeManager
};

export default deps;
