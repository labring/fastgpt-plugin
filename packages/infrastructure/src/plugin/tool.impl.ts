import type { ToolType } from '@domain/entities/tool.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import {
  type ToolDetailInputType,
  type ToolDetailType,
  type ToolListInputType,
  type ToolListOutputType,
  type ToolManagerPort
} from '@domain/ports/plugin/tool.port';
import { createError } from '@domain/value-objects/error.vo';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolRunInputType } from '@domain/value-objects/tool.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { createPluginInvokeOptions, toPluginInvokeError } from './utils/plugin-invoke';
import { Semver } from './utils/semver';

type JsonObject = Record<string, unknown>;

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

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDescriptionFallback(description: unknown): string | undefined {
  if (typeof description === 'string' && description.length > 0) {
    return description;
  }

  if (!isJsonObject(description)) {
    return undefined;
  }

  const en = description.en;
  return typeof en === 'string' && en.length > 0 ? en : undefined;
}

function normalizeInputSchemaToolParams(inputSchema: unknown): unknown {
  if (!isJsonObject(inputSchema) || !isJsonObject(inputSchema.properties)) {
    return inputSchema;
  }

  const properties = Object.fromEntries(
    Object.entries(inputSchema.properties).map(([key, property]) => {
      if (!isJsonObject(property)) {
        return [key, property];
      }

      const normalizedProperty = { ...property };
      const hasToolDescription =
        typeof normalizedProperty.toolDescription === 'string' &&
        normalizedProperty.toolDescription.length > 0;
      const hasIsToolParam = normalizedProperty.isToolParam !== undefined;

      if (hasIsToolParam) {
        if (!hasToolDescription) {
          const fallback = getDescriptionFallback(normalizedProperty.description);
          if (fallback !== undefined) {
            normalizedProperty.toolDescription = fallback;
          }
        }

        return [key, normalizedProperty];
      }

      if (hasToolDescription) {
        normalizedProperty.isToolParam = true;
        return [key, normalizedProperty];
      }

      const fallback = getDescriptionFallback(normalizedProperty.description);
      if (fallback !== undefined) {
        normalizedProperty.toolDescription = fallback;
      }
      normalizedProperty.isToolParam = false;

      return [key, normalizedProperty];
    })
  );

  return {
    ...inputSchema,
    properties
  };
}

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
      inputSchema: normalizeInputSchemaToolParams(tool.inputSchema),
      children: tool.children?.map((child) => ({
        ...child,
        inputSchema: normalizeInputSchemaToolParams(child.inputSchema)
      })),
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

        if (!fallbackErr && fallbackTool.type === 'tool') {
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

    if (tool.type !== 'tool') {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Plugin type mismatch',
          reason: {
            en: 'Requested plugin is not a tool',
            'zh-CN': '请求的插件不是工具类型'
          },
          data: { pluginId, source: normalizedSource, version: tool.version, type: tool.type }
        })
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
  }: ToolRunInputType): Promise<Result<StreamData<PluginStreamMessageType>>> {
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

    const options = createPluginInvokeOptions({
      systemVar,
      source,
      fastgptBaseUrl: this.deps.fastgptBaseUrl
    });

    const [invokeRes, invokeErr] = await this.deps.pluginRuntimeManager.invoke<
      PluginStreamMessageType,
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


