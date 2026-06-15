import { randomUUID } from 'node:crypto';

import type { ToolType } from '@domain/entities/tool.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type {
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import {
  type ToolDetailInputType,
  type ToolDetailType,
  type ToolListInputType,
  type ToolListOutputType,
  type ToolManagerPort
} from '@domain/ports/plugin/tool.port';
import { createError, getErrorDefinition, type RegisteredError } from '@domain/value-objects/error.vo';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { InvokeManager } from './invoke/invoke.impl';
import { Semver } from './utils/semver';

export type ToolManagerDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  fastgptBaseUrl: string;
};

export type PluginToolRunPayloadType = {
  input: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  systemVar: SystemVarType;
  childId?: string;
};

export class ToolManager implements ToolManagerPort {
  private static instance: ToolManager;
  private constructor(private deps: ToolManagerDeps) {}

  private getInvokeToken(systemVar: SystemVarType) {
    const token = systemVar.invokeToken;
    return typeof token === 'string' ? token : '';
  }

  private toToolDetail({
    tool,
    source,
    isLatestVersion
  }: {
    tool: ToolType;
    source: PluginSourceType;
    isLatestVersion: boolean;
  }): ToolDetailType {
    return {
      ...tool,
      source,
      isToolset: Boolean(tool.children?.length),
      isLatestVersion
    };
  }

  private getLatestVersion<T extends { version: string }>(versionList: T[]): T | undefined {
    return versionList.reduce<T | undefined>((latest, current) => {
      if (!latest) {
        return current;
      }

      return new Semver(latest.version).compare(new Semver(current.version)) > 0 ? latest : current;
    }, undefined);
  }

  public static getInstance(deps: ToolManagerDeps): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager(deps);
    }
    return ToolManager.instance;
  }

  async list({ tags, op, sources }: ToolListInputType): Promise<Result<ToolListOutputType>> {
    const [tools, listErr] = await this.deps.pluginRepo.listToolSummaries({
      tags,
      op,
      sources
    });

    if (listErr) {
      return failureResult(
        {
          en: 'Failed to list tools',
          'zh-CN': '获取工具列表失败'
        },
        listErr
      );
    }

    return successResult(tools);
  }

  async detail({
    pluginId,
    source,
    version,
    fallbackLatestVersion
  }: ToolDetailInputType): Promise<Result<ToolDetailType>> {
    const normalizedSource = source ?? 'system';
    const normalizedVersion = version?.trim();

    const [versionList, err] = await this.deps.pluginRepo.listVersions({
      pluginId,
      source: normalizedSource
    });

    if (err) return failureResult(err);

    const latestVersion = this.getLatestVersion(versionList);

    const [tool, detailErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
      pluginId,
      source: normalizedSource,
      version: normalizedVersion
    });

    if (detailErr) {
      if (fallbackLatestVersion && normalizedVersion && latestVersion) {
        const [fallbackTool, fallbackErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
          pluginId,
          source: normalizedSource,
          version: latestVersion.version
        });

        if (!fallbackErr) {
          return successResult(
            this.toToolDetail({
              tool: fallbackTool,
              source: normalizedSource,
              isLatestVersion: true
            })
          );
        }
      }

      return failureResult(
        {
          en: 'Failed to get tool detail',
          'zh-CN': '获取工具详情失败'
        },
        detailErr
      );
    }

    return successResult(
      this.toToolDetail({
        tool,
        source: normalizedSource,
        isLatestVersion: latestVersion ? tool.version === latestVersion.version : !normalizedVersion
      })
    );
  }

  async run({
    input,
    pluginId,
    systemVar,
    version,
    childId,
    source,
    secrets
  }: ToolRunInputType): Promise<Result<StreamData<ToolStreamMessageType>>> {
    const [res, err] = await this.deps.pluginRepo.getPluginByUserPluginId({
      pluginId,
      source: source ?? 'system',
      version
    });

    if (err) {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Failed to get plugin by plugin id',
          reason: {
            en: 'Failed to get plugin by plugin id',
            'zh-CN': '获取插件失败'
          },
          cause: err.error,
          data: {
            childId,
            input,
            pluginId,
            source: source ?? 'system',
            ...(version ? { version } : {})
          }
        })
      );
    }

    const plugin = res;

    const payload = {
      input,
      systemVar,
      childId,
      secrets
    } satisfies PluginToolRunPayloadType;

    const options: PluginRuntimeInvokeOptions = {
      invocationId: randomUUID(),
      invoke: new InvokeManager({
        token: this.getInvokeToken(systemVar),
        fastgptBaseUrl: this.deps.fastgptBaseUrl
      }),
      ...(isDebugPluginSource(source)
        ? {
            debug: {
              ...getDebugIdentityFromSource(source),
              source
            }
          }
        : {})
    };

    const [invokeRes, invokeErr] = await this.deps.pluginRuntimeManager.invoke<
      ToolStreamMessageType,
      true
    >({
      uniqueId: {
        etag: plugin.etag,
        pluginId: plugin.pluginId,
        version: plugin.version
      },
      eventName: 'run',
      payload,
      returnStream: true,
      options
    });

    if (invokeErr) {
      return failureResult(
        toPluginInvokeError(invokeErr.error, {
          childId,
          input,
          pluginId: plugin.pluginId,
          source: source ?? 'system',
          version: plugin.version
        })
      );
    }

    return successResult(invokeRes);
  }
}

function isDebugPluginSource(source: PluginSourceType | undefined): source is string {
  return typeof source === 'string' && source.startsWith('debug:');
}

function getDebugIdentityFromSource(source: string): { tmbId?: string; userId?: string } {
  const parts = source.split(':');
  const tmbIndex = parts.indexOf('tmbId');
  const tmbId = tmbIndex >= 0 ? parts[tmbIndex + 1] : undefined;
  if (tmbId) {
    return { tmbId };
  }

  const userIndex = parts.indexOf('user');
  const userId = userIndex >= 0 ? parts[userIndex + 1] : undefined;
  if (userId) {
    return { userId };
  }

  throw createError(ErrorCode.pluginRuntimePluginNotFound, {
    message: 'Debug source must include tmbId or user id',
    data: { source }
  });
}

type ToolRunErrorContext = {
  pluginId: string;
  source: PluginSourceType;
  version: string;
  childId?: string;
  input: Record<string, unknown>;
};

function toPluginInvokeError(error: Error, context: ToolRunErrorContext): RegisteredError {
  if (isRegisteredError(error)) {
    return createError(error.code, {
      message: error.message,
      reason: error.reason,
      cause: error.cause ?? error,
      data: mergeErrorData(error.data, context)
    });
  }

  return createError(ErrorCode.pluginInvokeFailed, {
    message: error.message,
    reason: {
      en: `Invoke failed: ${error.message}`,
      'zh-CN': `调用失败：${error.message}`
    },
    cause: error,
    data: context
  });
}

function isRegisteredError(error: Error): error is RegisteredError {
  const code = (error as Partial<RegisteredError>).code;
  return (
    typeof code === 'string' &&
    getErrorDefinition(code) !== undefined &&
    typeof (error as Partial<RegisteredError>).reason === 'object'
  );
}

function mergeErrorData(
  data: Record<string, unknown> | undefined,
  context: ToolRunErrorContext
): Record<string, unknown> {
  return {
    ...(data ?? {}),
    ...context
  };
}
