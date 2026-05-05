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
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';

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
    version
  }: ToolDetailInputType): Promise<Result<ToolDetailType>> {
    const normalizedSource = source ?? 'system';

    const [versionList, err] = await this.deps.pluginRepo.listVersions({
      pluginId,
      source: normalizedSource
    });

    if (err) return failureResult(err);

    const latestVersion = versionList.reduce((latest, current) => {
      return new Semver(latest.version).compare(new Semver(current.version)) > 0 ? latest : current;
    });

    const [tool, detailErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
      pluginId,
      source: normalizedSource,
      version
    });

    if (detailErr) {
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
        isLatestVersion: version ? latestVersion.version === version : true // version 为 undefined 时，isLatestVersion 为 true
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
        {
          en: 'Failed to get plugin by plugin id',
          'zh-CN': '获取插件失败'
        },
        err
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
      })
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
        {
          en: 'Failed to invoke plugin',
          'zh-CN': '调用插件失败'
        },
        invokeErr
      );
    }

    return successResult(invokeRes);
  }
}
