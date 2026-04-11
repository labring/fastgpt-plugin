import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
import { failureResult, type Result } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { ToolAnswerType, ToolRunInputType } from '@domain/value-objects/tool.vo';

export type ToolManagerDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
};

export class ToolManager implements ToolManagerPort {
  private static instance: ToolManager;
  constructor(private deps: ToolManagerDeps) {}
  public getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = this;
    }
    return ToolManager.instance;
  }

  async run({
    input,
    pluginId,
    systemVar,
    version,
    childId
  }: ToolRunInputType): Promise<Result<StreamData<ToolAnswerType>>> {
    const [res, err] = await this.deps.pluginRepo.getPluginsByPluginId(pluginId);
    if (err) {
      return failureResult(
        {
          en: 'Failed to get plugin by plugin id',
          'zh-CN': '获取插件失败'
        },
        err
      );
    }
    // get the plugin
    const pluginList = res.filter((item) => item.pluginId === pluginId && item.version === version);
    // 目前这个 plugin 有且仅有一个（如果没有则抛错），后续用户上传的 plugin，需要通过额外的参数进行判断(teamId等)
    if (pluginList.length === 0) {
      return failureResult({
        en: 'Plugin not found',
        'zh-CN': '插件未找到'
      });
    }

    const plugin = pluginList[0];

    const [invokeRes, invokeErr] = await this.deps.pluginRuntimeManager.invoke(
      {
        etag: plugin.etag,
        pluginId: plugin.pluginId,
        version: plugin.version
      },
      {
        event: 'run',
        input: {
          input,
          systemVar,
          childId
        }
      }
    );

    if (invokeErr) {
      return failureResult(
        {
          en: 'Failed to invoke plugin',
          'zh-CN': '调用插件失败'
        },
        invokeErr
      );
    }

    return invokeRes;
  }
}
