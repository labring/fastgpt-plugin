import { serverEnv } from '@infrastructure/env';
import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
import { DebugPluginRepoOverlay } from '@infrastructure/plugin/debug-plugin.repo';
import { RedisPluginDebugSessionRepo } from '@infrastructure/plugin/debug-session.repo';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { CompositePluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/composite-runtime.manager';
import { ConnectionGatewayDebugRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/connection-gateway/debug-runtime.driver';
import { LocalPoolPluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/local-pool-runtime.driver';
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

const mongoPluginRepo = PluginRepo.getInstance({
  localFileStorageRepo,
  mongoClient,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  fileTTLManager
});

export const pluginRepo = new DebugPluginRepoOverlay({
  fallback: mongoPluginRepo,
  gatewayBaseUrl: serverEnv.CONNECTION_GATEWAY_BASE_URL,
  authToken: serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN
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
const connectionGatewayDebugRuntimeManager = new ConnectionGatewayDebugRuntimeManager({
  baseUrl: serverEnv.CONNECTION_GATEWAY_BASE_URL,
  authToken: serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN,
  requestTimeoutMs: serverEnv.CONNECTION_GATEWAY_DEBUG_REQUEST_TIMEOUT_MS,
  sourceForTmbId: ({ tmbId }) => `debug:tmbId:${tmbId}`
});

export const pluginRuntimeManager = new CompositePluginRuntimeManager({
  primary: localPoolPluginRuntimeManager,
  debug: connectionGatewayDebugRuntimeManager
});

export const toolManager = ToolManager.getInstance({
  pluginRepo,
  pluginRuntimeManager,
  fastgptBaseUrl: serverEnv.FASTGPT_BASE_URL
});

export const pluginDebugSessionRepo = new RedisPluginDebugSessionRepo(
  redisClient.getClient,
  serverEnv.JWT_SECRET
);

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
  pluginRuntimeManager,
  pluginDebugSessionRepo
};

export default deps;
