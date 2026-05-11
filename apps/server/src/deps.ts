import { env } from '@infrastructure/env';
import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
import { LocalPoolPluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/local-pool-runtime.driver';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { ToolManager } from '@infrastructure/plugin/tool.impl';
import { PluginPKFFileResolver } from '@infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';
import { RedisClient } from '@infrastructure/redis/redis-client';
import { MongoClient } from '@infrastructure/storage/mongo/index';
import { createS3Clients } from '@infrastructure/storage/s3';
import { URLFileFetcher } from '@infrastructure/utils/url-file-fetcher';

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
  fastgptBaseUrl: env.FASTGPT_BASE_URL
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
  toolManager,
  pluginRuntimeManager
};

export default deps;
