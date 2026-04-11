import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
import { PluginManager } from '@infrastructure/plugin/plugin.impl';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { PluginPKFFileResolver } from '@fastgpt-plugin/infrastructure/plugin/plugin-pkg-file-resolver.impl';
import { LocalPoolPluginRuntimeManager } from '@fastgpt-plugin/infrastructure/plugin/plugin-runtime/local-pool-runtime-manager.impl';
import { RedisClient } from '@infrastructure/redis/redis-client';
import { VersionKeyStore } from '@infrastructure/redis/version-key';
import { MongoClient } from '@infrastructure/storage/mongo/index';
import { createS3Clients } from '@infrastructure/storage/s3';
import { URLFileFetcher } from '@infrastructure/utils/url-file-fetcher';
import { ToolManager } from '@infrastructure/plugin/tool.impl';

export const mongoClient = MongoClient.getInstance();
export const { privateClients: s3PrivateClients, publicClients: s3PublicClients } =
  createS3Clients();

export const localFileStorageRepo = LocalFileStorageRepo.getInstance();

export const privateRemoteFileStorageRepo = RemoteFileStorageRepo.getInstance({
  mongoClient,
  s3Clients: s3PrivateClients
});

export const publicRemoteFileStorageRepo = RemoteFileStorageRepo.getInstance({
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

export const pluginManager = PluginManager.getInstance({
  pluginRepo,
  pluginPKGFileResolver,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  pluginRuntimeManager: localPoolPluginRuntimeManager
});

export const toolManager = ToolManager.({});

const deps = {
  localFileStorageRepo,
  pluginPKGFileResolver,
  pluginManager,
  urlFileFetcher,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  pluginRepo,
  mongoClient,
  fileTTLManager
};

export default deps;
