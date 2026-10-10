import type { ModerationType } from '@domain/entities/moderation.entity';
import {
  type ModerationDetailInputType,
  type ModerationDetailType,
  type ModerationManagerPort
} from '@domain/ports/plugin/moderation.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { createError } from '@domain/value-objects/error.vo';
import {
  type ModerationCheckPayloadType,
  type ModerationCheckRunInputType,
  ModerationResultSchema,
  type ModerationResultType
} from '@domain/value-objects/moderation.vo';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { consumePluginResult } from './utils/consume-plugin-result';
import { createPluginInvokeOptions, toPluginInvokeError } from './utils/plugin-invoke';
import { Semver } from './utils/semver';

export type ModerationManagerDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  fastgptBaseUrl: string;
};

export class ModerationManager implements ModerationManagerPort {
  private static instance: ModerationManager;
  private constructor(private deps: ModerationManagerDeps) {}

  private getLatestVersion<T extends { version: string }>(versionList: T[]): T | undefined {
    return versionList.reduce<T | undefined>((latest, current) => {
      if (!latest) {
        return current;
      }

      return new Semver(latest.version).compare(new Semver(current.version)) > 0 ? latest : current;
    }, undefined);
  }

  private toModerationDetail({
    plugin,
    source,
    isLatestVersion
  }: {
    plugin: ModerationType;
    source: PluginSourceType;
    isLatestVersion: boolean;
  }): ModerationDetailType {
    return {
      ...plugin,
      source,
      isLatestVersion
    };
  }

  public static getInstance(deps: ModerationManagerDeps): ModerationManager {
    if (!ModerationManager.instance) {
      ModerationManager.instance = new ModerationManager(deps);
    }
    return ModerationManager.instance;
  }

  async detail({
    pluginId,
    source,
    version,
    fallbackLatestVersion
  }: ModerationDetailInputType): Promise<Result<ModerationDetailType>> {
    const normalizedSource = source ?? 'system';
    const normalizedVersion = version?.trim();

    const [versionList, err] = await this.deps.pluginRepo.listVersions({
      pluginId,
      source: normalizedSource
    });

    if (err) return failureResult(err);

    const latestVersion = this.getLatestVersion(versionList);

    const [plugin, detailErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
      pluginId,
      source: normalizedSource,
      version: normalizedVersion
    });

    if (detailErr) {
      if (fallbackLatestVersion && normalizedVersion && latestVersion) {
        const [fallbackPlugin, fallbackErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
          pluginId,
          source: normalizedSource,
          version: latestVersion.version
        });

        if (!fallbackErr && fallbackPlugin.type === 'moderation') {
          return successResult(
            this.toModerationDetail({
              plugin: fallbackPlugin,
              source: normalizedSource,
              isLatestVersion: true
            })
          );
        }
      }

      return failureResult(
        {
          en: 'Failed to get moderation plugin detail',
          'zh-CN': '获取审查插件详情失败'
        },
        detailErr
      );
    }

    if (plugin.type !== 'moderation') {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Plugin type mismatch',
          reason: {
            en: 'Requested plugin is not a moderation plugin',
            'zh-CN': '请求的插件不是审查类型'
          },
          data: { pluginId, source: normalizedSource, version: plugin.version, type: plugin.type }
        })
      );
    }

    return successResult(
      this.toModerationDetail({
        plugin,
        source: normalizedSource,
        isLatestVersion: latestVersion
          ? plugin.version === latestVersion.version
          : !normalizedVersion
      })
    );
  }

  async check(input: ModerationCheckRunInputType): Promise<Result<ModerationResultType>> {
    const { pluginId, source, version, input: checkInput } = input;
    const normalizedSource = source ?? 'system';

    const [plugin, pluginErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
      pluginId,
      source: normalizedSource,
      version
    });

    if (pluginErr) {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Failed to get plugin by plugin id',
          reason: {
            en: 'Failed to get plugin by plugin id',
            'zh-CN': '获取插件失败'
          },
          cause: pluginErr.error,
          data: {
            pluginId,
            source: normalizedSource,
            ...(version ? { version } : {})
          }
        })
      );
    }

    if (plugin.type !== 'moderation') {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Plugin type mismatch',
          reason: {
            en: 'Requested plugin is not a moderation plugin',
            'zh-CN': '请求的插件不是审查类型'
          },
          data: { pluginId, source: normalizedSource, version: plugin.version, type: plugin.type }
        })
      );
    }

    const payload = {
      input: checkInput,
      secrets: input.secrets,
      systemVar: input.systemVar
    } satisfies ModerationCheckPayloadType;

    const options = createPluginInvokeOptions({
      systemVar: input.systemVar,
      source,
      fastgptBaseUrl: this.deps.fastgptBaseUrl
    });

    const [stream, invokeErr] = await this.deps.pluginRuntimeManager.invoke<
      PluginStreamMessageType,
      true
    >({
      uniqueId: {
        etag: plugin.etag,
        pluginId: plugin.pluginId,
        version: plugin.version
      },
      eventName: 'check',
      payload,
      returnStream: true,
      options
    });

    if (invokeErr) {
      return failureResult(
        toPluginInvokeError(invokeErr.error, {
          input: checkInput,
          pluginId: plugin.pluginId,
          source: normalizedSource,
          version: plugin.version
        })
      );
    }

    return consumePluginResult({
      stream,
      schema: ModerationResultSchema,
      context: {
        pluginId: plugin.pluginId,
        source: normalizedSource,
        version: plugin.version,
        eventName: 'check'
      }
    });
  }
}
