import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { CoworkerdConfigSchema, CoworkerdPluginConfigSchema } from '@domain/entities/plugin-coworkerd.entity';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { serverEnv } from '@infrastructure/env';
import { LocalFileStorageRepo } from '@infrastructure/file-storage/local-file-storage.repo';
import { RemoteFileStorageRepo } from '@infrastructure/file-storage/remote-file-storage.repo';
import { FileTTLManager } from '@infrastructure/file-ttl/file-ttl.impl';
import { getRuntimeMetrics } from '@infrastructure/metrics';
import { DebugPluginRepoOverlay } from '@infrastructure/plugin/debug-plugin.repo';
import { RedisPluginDebugSessionRepo } from '@infrastructure/plugin/debug-session.repo';
import { InternalPluginInvokeTokenService } from '@infrastructure/plugin/invoke/internal-invoke-token.service';
import { ModerationManager } from '@infrastructure/plugin/moderation.impl';
import { PluginRepo } from '@infrastructure/plugin/plugin.repo';
import { CompositePluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/composite-runtime.manager';
import { ConnectionGatewayDebugRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/connection-gateway/debug-runtime.driver';
import { CoworkerdFallbackRuntimeDriver } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/coworkerd-fallback-runtime.driver';
import { CoworkerdPluginRuntimeDriver } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/coworkerd-runtime.driver';
import { createWorkerArtifactBuilder, readWorkerArtifact } from '@infrastructure/plugin/plugin-runtime/drivers/coworkerd/worker-artifact';
import { LocalPoolPluginRuntimeManager } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/local-pool-runtime.driver';
import { resolveSdkFactoryPackageRoot } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/sdk-factory-runtime';
import { PluginRuntimeConfigRepo } from '@infrastructure/plugin/plugin-runtime/plugin-runtime-config.repo';
import { ToolManager } from '@infrastructure/plugin/tool.impl';
import { PluginPKFFileResolver } from '@infrastructure/plugin/utils/plugin-pkg-file-resolver.impl';
import { RedisClient } from '@infrastructure/redis/redis-client';
import { MongoClient } from '@infrastructure/storage/mongo/index';
import { createS3Clients } from '@infrastructure/storage/s3';
import { URLFileFetcher } from '@infrastructure/utils/url-file-fetcher';

// Load the standalone SDK module from the runtime-sdk copied into the server
// distribution. Bundling it into main.js would break its import.meta-relative entries.
const loadWorkerBundler = () => import(pathToFileURL(join(resolveSdkFactoryPackageRoot(), 'dist/bundler.js')).href) as Promise<typeof import('@fastgpt-plugin/sdk-factory/bundler')>;

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

const coworkerdFallbackEnabled =
  serverEnv.PLUGIN_RUNTIME_MODE === 'coworkerd' && serverEnv.COWORKERD_FALLBACK_TO_LOCAL_POOL;

const mongoPluginRepo = PluginRepo.getInstance({
  localFileStorageRepo,
  mongoClient,
  privateRemoteFileStorageRepo,
  publicRemoteFileStorageRepo,
  fileTTLManager,
  artifactBuilder: serverEnv.PLUGIN_RUNTIME_MODE === 'coworkerd'
    ? createWorkerArtifactBuilder({
        invokeGatewayUrl: serverEnv.INTERNAL_PLUGIN_INVOKE_GATEWAY_URL!,
        compile: async (options) => (await loadWorkerBundler()).compileWorker(options)
      })
    : undefined,
  allowArtifactBuildFallback: coworkerdFallbackEnabled
});

export const pruneExpiredPluginUploads = () => mongoPluginRepo.pruneExpiredUploads();

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

const localPoolPluginRuntimeManager =
  serverEnv.PLUGIN_RUNTIME_MODE !== 'coworkerd' || coworkerdFallbackEnabled
    ? LocalPoolPluginRuntimeManager.getInstance({ pluginRepo, mongoClient, redisClient })
    : undefined;
const connectionGatewayDebugRuntimeManager = new ConnectionGatewayDebugRuntimeManager({
  enabled: serverEnv.REMOTE_DEBUG_ENABLED,
  baseUrl: serverEnv.CONNECTION_GATEWAY_BASE_URL,
  authToken: serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN ?? '',
  requestTimeoutMs: serverEnv.CONNECTION_GATEWAY_DEBUG_REQUEST_TIMEOUT_MS
});

const coworkerdRuntimeManager = serverEnv.PLUGIN_RUNTIME_MODE === 'coworkerd'
  ? new CoworkerdPluginRuntimeDriver({
      config: CoworkerdConfigSchema.parse({
        apiServerUrl: serverEnv.COWORKERD_API_SERVER_URL,
        ingressUrl: serverEnv.COWORKERD_INGRESS_URL,
        managementToken: serverEnv.COWORKERD_MANAGEMENT_TOKEN,
        defaultLimits: {
          cpuMs: serverEnv.COWORKERD_DEFAULT_CPU_MS,
          memoryMiB: serverEnv.COWORKERD_DEFAULT_MEMORY_MIB
        },
        internalInvokeGatewayUrl: serverEnv.INTERNAL_PLUGIN_INVOKE_GATEWAY_URL,
        requestTimeoutMs: serverEnv.POOL_SERVICE_POD_TIMEOUT
      }),
      configRepo: new PluginRuntimeConfigRepo(
        { mongoClient },
        CoworkerdPluginConfigSchema.parse({
          tenantId: 'system',
          limits: {
            cpuMs: serverEnv.COWORKERD_DEFAULT_CPU_MS,
            memoryMiB: serverEnv.COWORKERD_DEFAULT_MEMORY_MIB
          }
        }),
        'coworkerd'
      ),
      defaultPluginConfig: CoworkerdPluginConfigSchema.parse({
        tenantId: 'system',
        limits: {
          cpuMs: serverEnv.COWORKERD_DEFAULT_CPU_MS,
          memoryMiB: serverEnv.COWORKERD_DEFAULT_MEMORY_MIB
        }
      }),
      compatibilityDate: serverEnv.COWORKERD_COMPATIBILITY_DATE,
      resolveWorkerCode: async (uniqueId) => {
        const [bytes, error] = await mongoPluginRepo.getWorkerArtifact(uniqueId);
        if (error) return failureResult(error);
        try {
          return successResult(readWorkerArtifact(bytes, serverEnv.INTERNAL_PLUGIN_INVOKE_GATEWAY_URL!).code);
        } catch (error) {
          return failureResult({ en: 'Invalid Worker artifact; upload the plugin again', 'zh-CN': 'Worker 产物无效，请重新上传插件' }, error);
        }
      },
      package: async (options) => (await loadWorkerBundler()).packageWorkerBundle(options),
      metricsRecorder: getRuntimeMetrics()
    })
  : undefined;

const effectiveCoworkerdRuntimeManager =
  coworkerdRuntimeManager && coworkerdFallbackEnabled && localPoolPluginRuntimeManager
    ? new CoworkerdFallbackRuntimeDriver({
        coworkerd: coworkerdRuntimeManager,
        localPool: localPoolPluginRuntimeManager,
        metricsRecorder: getRuntimeMetrics()
      })
    : coworkerdRuntimeManager;

export const pluginRuntimeManager = new CompositePluginRuntimeManager({
  primary: localPoolPluginRuntimeManager,
  coworkerd: effectiveCoworkerdRuntimeManager,
  mode: serverEnv.PLUGIN_RUNTIME_MODE === 'coworkerd' ? 'coworkerd' : 'primary',
  debug: connectionGatewayDebugRuntimeManager
});

export const internalPluginInvokeTokenService = serverEnv.INTERNAL_PLUGIN_INVOKE_GATEWAY_URL && serverEnv.INTERNAL_PLUGIN_INVOKE_SECRET
  ? new InternalPluginInvokeTokenService(
      serverEnv.INTERNAL_PLUGIN_INVOKE_SECRET,
      serverEnv.INTERNAL_PLUGIN_INVOKE_TOKEN_TTL_MS
    )
  : undefined;

export const toolManager = ToolManager.getInstance({
  pluginRepo,
  pluginRuntimeManager,
  fastgptBaseUrl: serverEnv.FASTGPT_BASE_URL,
  internalInvokeTokenService: internalPluginInvokeTokenService,
  internalInvokeGatewayUrl: serverEnv.INTERNAL_PLUGIN_INVOKE_GATEWAY_URL
});

export const moderationManager = ModerationManager.getInstance({
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
  moderationManager,
  pluginRuntimeManager,
  pluginDebugSessionRepo
};

export default deps;
