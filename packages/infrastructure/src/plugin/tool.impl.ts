import { randomUUID } from 'node:crypto';

import type { ToolType } from '@domain/entities/tool.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type {
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type {
  ToolDetailInputType,
  ToolDetailType,
  ToolListInputType,
  ToolListItemType,
  ToolListOutputType,
  ToolManagerPort
} from '@domain/ports/plugin/tool.port';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import { InvokeManager, type InvokeUploadFileHandler } from './invoke/invoke.impl';

export type ToolManagerDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  uploadFileHandler: InvokeUploadFileHandler;
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
    const token = systemVar.tool.token ?? systemVar.tool.accessToken;
    return typeof token === 'string' ? token : '';
  }

  private toToolListItem(tool: ToolDetailType): ToolListItemType {
    return {
      pluginId: tool.pluginId,
      version: tool.version,
      etag: tool.etag,
      type: tool.type,
      author: tool.author,
      name: tool.name,
      icon: tool.icon,
      tutorialUrl: tool.tutorialUrl,
      readmeUrl: tool.readmeUrl,
      repoUrl: tool.repoUrl,
      description: tool.description,
      tags: tool.tags,
      source: tool.source,
      toolDescription: tool.toolDescription,
      isToolset: tool.isToolset,
      children: tool.children?.map((child) => ({
        childId: child.id,
        name: child.name,
        description: child.description,
        toolDescription: child.toolDescription
      }))
    };
  }

  private toToolDetail(tool: ToolType, source: PluginSourceType): ToolDetailType {
    return {
      ...tool,
      source,
      isToolset: Boolean(tool.children?.length)
    };
  }

  public static getInstance(deps: ToolManagerDeps): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager(deps);
    }
    return ToolManager.instance;
  }

  async list({ tags, op, sources }: ToolListInputType): Promise<Result<ToolListOutputType>> {
    const [plugins, listErr] = await this.deps.pluginRepo.list({
      types: ['tool'],
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

    const tools: ToolListOutputType = [];

    for (const plugin of plugins) {
      const [tool, detailErr] = await this.deps.pluginRepo.getPluginByUserPluginId({
        pluginId: plugin.pluginId,
        source: plugin.source,
        version: plugin.version
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

      tools.push(this.toToolListItem(this.toToolDetail(tool, plugin.source)));
    }

    return successResult(tools);
  }

  async detail({
    pluginId,
    source,
    version
  }: ToolDetailInputType): Promise<Result<ToolDetailType>> {
    const normalizedSource = source ?? 'system';
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

    return successResult(this.toToolDetail(tool, normalizedSource));
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
        uploadFileHandler: this.deps.uploadFileHandler
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
