import { LocalPoolPluginRuntimeManager } from '@fastgpt-plugin/infrastructure/plugin/plugin-runtime/drivers/local-pool/local-pool-runtime.driver';
import { PluginPKFFileResolver } from '@fastgpt-plugin/infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';

import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
// import { PluginManager } from '@infrastructure/plugin/pl';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { ToolManager } from '@infrastructure/plugin/tool.impl';
import { RedisClient } from '@infrastructure/redis/redis-client';
import { VersionKeyStore } from '@infrastructure/redis/version-key';
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

export const pluginRepo = new PluginRepo({
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

const versionKeyStore = new VersionKeyStore({
  redisClient
});

const localPoolPluginRuntimeManager = LocalPoolPluginRuntimeManager.getInstance({
  pluginRepo,
  mongoClient,
  versionKeyStore
});

export const toolManager = ToolManager.getInstance({
  pluginRepo,
  pluginRuntimeManager: localPoolPluginRuntimeManager
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
  pluginRuntimeManager: localPoolPluginRuntimeManager
};

export default deps;
