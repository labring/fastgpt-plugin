import { createStorage, type IStorageOptions } from '@fastgpt-sdk/storage';

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
import { FCPluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/fc.plugin-runtime.driver';
import { FCAliyunFunctionProvider } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/fc-aliyun-function-provider';
import { FCHttpFunctionProvider } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/fc-http-function-provider';
import { FCRuntimeArtifactRepo } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/fc-runtime-artifact.repo';
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
  authToken: serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN ?? '',
  remoteDebugEnabled: serverEnv.REMOTE_DEBUG_ENABLED
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
  enabled: serverEnv.REMOTE_DEBUG_ENABLED,
  baseUrl: serverEnv.CONNECTION_GATEWAY_BASE_URL,
  authToken: serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN ?? '',
  requestTimeoutMs: serverEnv.CONNECTION_GATEWAY_DEBUG_REQUEST_TIMEOUT_MS
});

const fcArtifactStorageClient =
  serverEnv.PLUGIN_RUNTIME_MODE === 'serverless-fc'
    ? createStorage({
        vendor: 'oss',
        bucket: serverEnv.FC_ARTIFACT_BUCKET ?? '',
        region: serverEnv.FC_ARTIFACT_REGION ?? serverEnv.FC_REGION ?? '',
        endpoint: serverEnv.FC_ARTIFACT_ENDPOINT ?? '',
        credentials: {
          accessKeyId: serverEnv.FC_ARTIFACT_ACCESS_KEY_ID ?? serverEnv.FC_ACCESS_KEY_ID ?? '',
          secretAccessKey:
            serverEnv.FC_ARTIFACT_ACCESS_KEY_SECRET ?? serverEnv.FC_ACCESS_KEY_SECRET ?? ''
        },
        secure: true,
        internal: false,
        cname: false,
        enableProxy: false
      } as IStorageOptions)
    : undefined;

export const fcRuntimeArtifactRepo = fcArtifactStorageClient
  ? new FCRuntimeArtifactRepo({
      storageClient: fcArtifactStorageClient,
      bucket: serverEnv.FC_ARTIFACT_BUCKET,
      prefix: serverEnv.FC_ARTIFACT_PREFIX
    })
  : undefined;

const fcFunctionProvider =
  serverEnv.PLUGIN_RUNTIME_MODE === 'serverless-fc' &&
  serverEnv.FC_HTTP_BASE_URL &&
  serverEnv.FC_INVOKE_SIGNING_SECRET
    ? new FCHttpFunctionProvider({
        httpBaseUrl: serverEnv.FC_HTTP_BASE_URL,
        signingSecret: serverEnv.FC_INVOKE_SIGNING_SECRET
      })
    : serverEnv.PLUGIN_RUNTIME_MODE === 'serverless-fc'
      ? new FCAliyunFunctionProvider({
          region: serverEnv.FC_REGION ?? '',
          endpoint: serverEnv.FC_ENDPOINT,
          accessKeyId: serverEnv.FC_ACCESS_KEY_ID,
          accessKeySecret: serverEnv.FC_ACCESS_KEY_SECRET,
          vpcId: serverEnv.FC_VPC_ID,
          vSwitchIds: serverEnv.FC_VSWITCH_IDS?.split(',')
            .map((id) => id.trim())
            .filter(Boolean),
          securityGroupId: serverEnv.FC_SECURITY_GROUP_ID
        })
      : undefined;

const fcPluginRuntimeManager =
  serverEnv.PLUGIN_RUNTIME_MODE === 'serverless-fc' && fcRuntimeArtifactRepo
    ? FCPluginRuntimeManager.getInstance({
        pluginRepo,
        mongoClient,
        redisClient,
        artifactRepo: fcRuntimeArtifactRepo,
        functionProvider: fcFunctionProvider
      })
    : undefined;

export const pluginRuntimeManager = new CompositePluginRuntimeManager({
  primary: fcPluginRuntimeManager ?? localPoolPluginRuntimeManager,
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
  pluginDebugSessionRepo,
  fcRuntimeArtifactRepo
};

export default deps;
