import type { PluginType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema, type PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

export const listReplacedActivePlugins = async (
  pluginRepo: PluginRepoPort,
  uniqueId: PluginUniqueIdType
): Promise<Result<PluginType[]>> => {
  const [activePlugins, activeErr] = await pluginRepo.listActive();

  if (activeErr) {
    return failureResult(
      {
        en: 'Failed to get active plugins',
        'zh-CN': '获取 active 插件失败'
      },
      activeErr
    );
  }

  return successResult(
    activePlugins.filter(
      (plugin) =>
        plugin.pluginId === uniqueId.pluginId &&
        plugin.version === uniqueId.version &&
        plugin.etag !== uniqueId.etag
    )
  );
};

export const disableAndUnregisterReplacedPlugins = async (deps: {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  replacedPlugins: PluginType[];
}): Promise<Result> => {
  const replacedPluginIds = deps.replacedPlugins.map((plugin) =>
    PluginUniqueIdSchema.parse(plugin)
  );
  const replacedRunnablePluginIds = deps.replacedPlugins
    .filter((plugin) => plugin.type === 'tool')
    .map((plugin) => PluginUniqueIdSchema.parse(plugin));

  const [, disableErr] = await deps.pluginRepo.disablePlugins(replacedPluginIds);

  if (disableErr) {
    return failureResult(
      {
        en: 'Failed to disable replaced plugins',
        'zh-CN': '禁用被替换插件失败'
      },
      disableErr
    );
  }

  await Promise.all(
    replacedRunnablePluginIds.map(async (uniqueId) => {
      try {
        const [, unregisterErr] = await deps.pluginRuntimeManager.unregister(uniqueId);
        if (unregisterErr) {
          console.error('Failed to unregister replaced plugin runtime', {
            pluginId: uniqueId.pluginId,
            version: uniqueId.version,
            etag: uniqueId.etag,
            error: unregisterErr
          });
        }
      } catch (error) {
        console.error('Failed to unregister replaced plugin runtime', {
          pluginId: uniqueId.pluginId,
          version: uniqueId.version,
          etag: uniqueId.etag,
          error
        });
      }
    })
  );

  return successResult({});
};
