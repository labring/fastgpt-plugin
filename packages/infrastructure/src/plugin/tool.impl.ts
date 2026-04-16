import { randomUUID } from 'node:crypto';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type {
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
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

  public static getInstance(deps: ToolManagerDeps): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager(deps);
    }
    return ToolManager.instance;
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
