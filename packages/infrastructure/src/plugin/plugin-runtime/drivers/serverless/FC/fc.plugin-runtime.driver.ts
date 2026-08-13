/**
 * Aliyun FC serverless plugin runtime manager.
 */

import { Mutex } from 'es-toolkit';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import type { RedisClient } from '@infrastructure/redis/redis-client';

import { env } from '../../../../../env';
import { getLogger, mod } from '../../../../../logger';
import { VersionKeyStore } from '../../../../../redis/version-key';
import type { MongoClient } from '../../../../../storage/mongo';
import { PluginRuntimeConfigRepo } from '../../../plugin-runtime-config.repo';

import { FC_DEFAULT_PLUGIN_CONFIG } from './const';
import { FC_RUNTIME_COMMAND, FC_RUNTIME_ENTRYPOINT } from './constants';
import { FCFunctionInvoker } from './fc-function-invoker';
import { InMemoryFCFunctionProvider } from './fc-function-provider';
import { FCFunctionRegistry } from './fc-function-registry';
import type { FCRuntimeArtifactRepo } from './fc-runtime-artifact.repo';
import { getFCFunctionName, getFCRuntimeId } from './function-name';
import type {
  FCArtifactInfo,
  FCFunctionDefinition,
  FCFunctionProvider,
  FCManagerMetrics,
  FCPluginConfigType,
  FCPluginItemType,
  FCPluginStatus
} from './types';
import { FCPluginConfigSchema, FCRuntimeError } from './types';

export type FCPluginRuntimeManagerDeps = {
  mongoClient: MongoClient;
  redisClient: RedisClient;
  pluginRepo: PluginRepoPort;
  artifactRepo: FCRuntimeArtifactRepo;
  functionProvider?: FCFunctionProvider;
};

export class FCPluginRuntimeManager implements PluginRuntimeManagerPort<FCPluginConfigType> {
  private readonly plugins = new Map<string, FCPluginItemType>();
  private readonly pluginIdMap = new Map<string, string[]>();
  private readonly versionKeyStore: VersionKeyStore;
  private readonly configRepo: PluginRuntimeConfigRepo<FCPluginConfigType>;
  private readonly registry: FCFunctionRegistry;
  private readonly invoker: FCFunctionInvoker;
  private readonly logger = getLogger(mod.tool);
  private destroyed = false;
  private totalRequests = 0;
  private totalErrors = 0;

  private static instance: FCPluginRuntimeManager;

  public static getInstance(deps: FCPluginRuntimeManagerDeps): FCPluginRuntimeManager {
    if (!FCPluginRuntimeManager.instance) {
      FCPluginRuntimeManager.instance = new FCPluginRuntimeManager(deps);
    }
    return FCPluginRuntimeManager.instance;
  }

  protected constructor(private readonly deps: FCPluginRuntimeManagerDeps) {
    const provider = deps.functionProvider ?? new InMemoryFCFunctionProvider();
    this.versionKeyStore = new VersionKeyStore(
      {
        redisClient: deps.redisClient
      },
      'plugin-runtime'
    );
    this.configRepo = new PluginRuntimeConfigRepo(
      {
        mongoClient: deps.mongoClient
      },
      FC_DEFAULT_PLUGIN_CONFIG
    );
    this.registry = new FCFunctionRegistry(provider);
    this.invoker = new FCFunctionInvoker({ provider });
  }

  async getConfig(pluginId: string): Promise<Result<FCPluginConfigType>> {
    const [config, err] = await this.configRepo.getPluginRuntimeConfig(pluginId);
    if (err) {
      return failureResult(
        {
          en: 'Failed to get FC plugin runtime config',
          'zh-CN': '获取 FC 插件运行时配置失败'
        },
        err
      );
    }

    return this.parsePluginConfig(config);
  }

  async updateConfig(pluginId: string, config: FCPluginConfigType): Promise<Result> {
    const [pluginConfig, parseErr] = this.parsePluginConfig(config);
    if (parseErr) {
      return failureResult(parseErr);
    }

    const [, err] = await this.configRepo.savePluginRuntimeConfig(pluginId, pluginConfig);
    if (err) {
      return failureResult(
        {
          en: 'Failed to update FC plugin runtime config',
          'zh-CN': '更新 FC 插件运行时配置失败'
        },
        err
      );
    }

    const runtimeIds = this.pluginIdMap.get(pluginId) ?? [];
    for (const runtimeId of runtimeIds) {
      const item = this.plugins.get(runtimeId);
      if (!item) {
        continue;
      }

      try {
        await item.mutex.acquire();
        item.config = pluginConfig;
        const artifact = item.artifact;
        const functionName = item.functionName;
        const ensureResult = await this.registry.ensureFunction(
          this.toFunctionDefinition({
            uniqueId: {
              pluginId: item.meta.pluginId,
              version: item.meta.version,
              etag: item.meta.etag
            },
            runtimeId,
            functionName,
            config: pluginConfig,
            artifact
          })
        );
        item.functionState = ensureResult.function.state;
        item.updatedAt = ensureResult.function.updatedAt;
      } finally {
        item.mutex.release();
      }
    }

    return successResult({});
  }

  async resetConfig(pluginId: string): Promise<Result> {
    const [config, err] = await this.configRepo.resetPluginRuntimeConfig(pluginId);
    if (err) {
      return failureResult(
        {
          en: 'Failed to reset FC plugin runtime config',
          'zh-CN': '重置 FC 插件运行时配置失败'
        },
        err
      );
    }

    return this.updateConfig(pluginId, config);
  }

  async status(uniqueId: PluginUniqueIdType): Promise<Result<FCPluginStatus>> {
    const runtimeId = getFCRuntimeId(uniqueId);
    const item = this.plugins.get(runtimeId);
    if (!item) {
      return failureResult({
        en: 'FC plugin runtime not found',
        'zh-CN': '未找到 FC 插件运行时'
      });
    }

    return successResult(this.toStatus(item));
  }

  async globalStatus(): Promise<Result<FCManagerMetrics>> {
    const functions = Object.fromEntries(
      [...this.plugins.entries()].map(([runtimeId, item]) => [runtimeId, this.toStatus(item)])
    );
    const activeInvocations = Object.values(functions).reduce(
      (sum, item) => sum + item.activeInvocations,
      0
    );

    return successResult({
      activeInvocations,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      totalFunctions: Object.keys(functions).length,
      functions
    });
  }

  async shutdown(): Promise<Result> {
    this.destroyed = true;
    this.plugins.clear();
    this.pluginIdMap.clear();
    return successResult({});
  }

  async register(uniqueId: PluginUniqueIdType): Promise<Result> {
    const runtimeId = getFCRuntimeId(uniqueId);

    if (this.destroyed) {
      return failureResult({
        en: 'FC plugin runtime manager already destroyed',
        'zh-CN': 'FC 插件运行时管理器已销毁'
      });
    }

    if (this.plugins.has(runtimeId)) {
      return successResult({});
    }

    const [config, configErr] = await this.getConfig(uniqueId.pluginId);
    if (configErr) {
      return failureResult(configErr);
    }

    const [plugin, pluginErr] = await this.deps.pluginRepo.getPluginById(uniqueId);
    if (pluginErr) {
      return failureResult(
        {
          en: 'Register FC plugin error, can not get plugin info',
          'zh-CN': '注册 FC 插件失败，无法获取插件信息'
        },
        pluginErr
      );
    }

    const [artifact, artifactErr] = await this.deps.artifactRepo.ensureArtifact({
      uniqueId,
      indexFile: plugin.indexFile
    });
    if (artifactErr) {
      return failureResult(
        {
          en: 'Failed to ensure FC plugin artifact',
          'zh-CN': '确保 FC 插件 artifact 失败'
        },
        artifactErr
      );
    }

    const functionName = getFCFunctionName(uniqueId, env.FC_FUNCTION_NAME_PREFIX);

    try {
      const ensureResult = await this.registry.ensureFunction(
        this.toFunctionDefinition({
          uniqueId,
          runtimeId,
          functionName,
          config,
          artifact
        })
      );

      this.plugins.set(runtimeId, {
        runtimeId,
        functionName,
        config,
        meta: plugin.info,
        artifact,
        functionState: ensureResult.function.state,
        updatedAt: ensureResult.function.updatedAt,
        mutex: new Mutex(),
        metrics: {
          totalRequests: 0,
          totalErrors: 0,
          activeInvocations: 0
        },
        invokeSessions: new Map()
      });
      this.addPluginRuntimeId(uniqueId.pluginId, runtimeId);
      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to ensure FC function',
          'zh-CN': '确保 FC 函数失败'
        },
        error
      );
    }
  }

  async unregister(uniqueId: PluginUniqueIdType): Promise<Result> {
    const runtimeId = getFCRuntimeId(uniqueId);
    const record = this.plugins.get(runtimeId);
    if (!record) {
      return successResult({});
    }

    try {
      await this.registry.deleteFunction(record.functionName);
      this.plugins.delete(runtimeId);
      this.removePluginRuntimeId(uniqueId.pluginId, runtimeId);
      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to unregister FC plugin runtime',
          'zh-CN': '注销 FC 插件运行时失败'
        },
        error
      );
    }
  }

  async invoke<
    E extends PluginInvokeEventNameType,
    P = unknown,
    R = unknown,
    S extends boolean = boolean
  >({
    uniqueId,
    eventName,
    payload,
    returnStream,
    options
  }: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    if (this.destroyed) {
      return failureResult({
        en: 'FC plugin runtime manager already destroyed',
        'zh-CN': 'FC 插件运行时管理器已销毁'
      });
    }

    const plugin = await this.getPlugin(uniqueId);
    if (!plugin) {
      return failureResult({ en: 'Plugin not found', 'zh-CN': '插件未找到' });
    }

    if (!(plugin.meta.type === 'tool' && eventName === 'run')) {
      return failureResult({ en: 'Event not supported', 'zh-CN': '不支持的事件' });
    }

    const invocationId = options?.invocationId;
    if (invocationId && options?.invoke) {
      plugin.invokeSessions.set(invocationId, options.invoke);
    }

    plugin.metrics.totalRequests++;
    plugin.metrics.activeInvocations++;
    this.totalRequests++;

    try {
      const result = await this.invoker.invoke<P, R, S>({
        functionName: plugin.functionName,
        runtimeId: plugin.runtimeId,
        eventName,
        payload,
        returnStream,
        timeoutMs: options?.timeout ?? plugin.config.timeoutMs,
        invocationMode: plugin.config.invocationMode,
        invocationId
      });

      this.bindInvokeSessionLifecycle(plugin, invocationId, result);
      return successResult(result);
    } catch (error) {
      plugin.metrics.totalErrors++;
      this.totalErrors++;
      plugin.invokeSessions.delete(invocationId ?? '');
      this.logger.error('FC plugin invoke failed', {
        runtimeId: plugin.runtimeId,
        error
      });
      return failureResult({ en: 'FC invoke failed', 'zh-CN': 'FC 调用失败' }, error);
    } finally {
      plugin.metrics.activeInvocations = Math.max(0, plugin.metrics.activeInvocations - 1);
    }
  }

  private async getPlugin(uniqueId: PluginUniqueIdType) {
    const runtimeId = getFCRuntimeId(uniqueId);
    if (await this.versionKeyStore.isVersionKeyExpired(runtimeId)) {
      await this.unregister(uniqueId);
      await this.register(uniqueId);
    }

    return this.plugins.get(runtimeId);
  }

  private parsePluginConfig(config: FCPluginConfigType): Result<FCPluginConfigType> {
    const result = FCPluginConfigSchema.safeParse(config);

    if (!result.success) {
      return failureResult(
        {
          en: 'Invalid FC plugin runtime config',
          'zh-CN': 'FC 插件运行时配置无效'
        },
        new FCRuntimeError('FC_CONFIG_INVALID', 'Invalid FC plugin runtime config', result.error)
      );
    }

    return successResult(result.data);
  }

  private toFunctionDefinition({
    uniqueId,
    runtimeId,
    functionName,
    config,
    artifact
  }: {
    uniqueId: PluginUniqueIdType;
    runtimeId: string;
    functionName: string;
    config: FCPluginConfigType;
    artifact: FCArtifactInfo;
  }): FCFunctionDefinition {
    return {
      uniqueId,
      runtimeId,
      functionName,
      image: env.FC_RUNTIME_IMAGE ?? '',
      roleArn: env.FC_ROLE_ARN ?? '',
      entrypoint: FC_RUNTIME_ENTRYPOINT,
      command: FC_RUNTIME_COMMAND,
      artifact,
      config,
      env: {
        NODE_ENV: 'production',
        PORT: '9000',
        PLUGIN_ID: uniqueId.pluginId,
        PLUGIN_VERSION: uniqueId.version,
        PLUGIN_ETAG: uniqueId.etag,
        PLUGIN_ARTIFACT_BUCKET: artifact.bucket,
        PLUGIN_ARTIFACT_KEY: artifact.key,
        PLUGIN_ARTIFACT_ENDPOINT: env.FC_ARTIFACT_ENDPOINT ?? '',
        FASTGPT_ARTIFACT_REGION: env.FC_ARTIFACT_REGION ?? env.FC_REGION ?? '',
        FASTGPT_ARTIFACT_ACCESS_KEY_ID:
          env.FC_ARTIFACT_ACCESS_KEY_ID ?? env.FC_ACCESS_KEY_ID ?? '',
        FASTGPT_ARTIFACT_ACCESS_KEY_SECRET:
          env.FC_ARTIFACT_ACCESS_KEY_SECRET ?? env.FC_ACCESS_KEY_SECRET ?? '',
        FASTGPT_BASE_URL: env.FASTGPT_BASE_URL,
        FASTGPT_INVOKE_SIGNING_SECRET: env.FC_INVOKE_SIGNING_SECRET ?? ''
      }
    };
  }

  private toStatus(item: FCPluginItemType): FCPluginStatus {
    return {
      runtimeId: item.runtimeId,
      functionName: item.functionName,
      config: item.config,
      meta: {
        pluginId: item.meta.pluginId,
        version: item.meta.version,
        etag: item.meta.etag,
        type: item.meta.type
      },
      artifact: {
        bucket: item.artifact.bucket,
        key: item.artifact.key,
        etag: item.artifact.etag,
        size: item.artifact.size
      },
      totalRequests: item.metrics.totalRequests,
      totalErrors: item.metrics.totalErrors,
      activeInvocations: item.metrics.activeInvocations,
      updatedAt: item.updatedAt,
      functionState: item.functionState
    };
  }

  private bindInvokeSessionLifecycle(
    plugin: FCPluginItemType,
    invocationId: string | undefined,
    result: unknown
  ): void {
    if (!invocationId) {
      return;
    }

    if (result && result instanceof StreamData) {
      const cleanup = () => {
        plugin.invokeSessions.delete(invocationId);
      };
      result.onEnd(cleanup).onError(cleanup);
      return;
    }

    plugin.invokeSessions.delete(invocationId);
  }

  private addPluginRuntimeId(pluginId: string, runtimeId: string): void {
    const runtimeIds = this.pluginIdMap.get(pluginId) ?? [];
    if (!runtimeIds.includes(runtimeId)) {
      runtimeIds.push(runtimeId);
    }
    this.pluginIdMap.set(pluginId, runtimeIds);
  }

  private removePluginRuntimeId(pluginId: string, runtimeId: string): void {
    const runtimeIds = this.pluginIdMap.get(pluginId);
    if (!runtimeIds) {
      return;
    }

    const nextRuntimeIds = runtimeIds.filter((id) => id !== runtimeId);
    if (nextRuntimeIds.length === 0) {
      this.pluginIdMap.delete(pluginId);
      return;
    }

    this.pluginIdMap.set(pluginId, nextRuntimeIds);
  }
}
