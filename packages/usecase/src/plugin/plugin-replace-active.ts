import type { PluginType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema, type PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

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
  logger: UsecaseLogger;
  replacementUniqueId?: PluginUniqueIdType;
  replacedPlugins: PluginType[];
  disableReplacedPlugins?: boolean;
}): Promise<Result> => {
  const replacedPluginIds = deps.replacedPlugins.map((plugin) =>
    PluginUniqueIdSchema.parse(plugin)
  );
  const replacedRunnablePluginIds = deps.replacedPlugins
    .filter((plugin) => plugin.type === 'tool')
    .map((plugin) => PluginUniqueIdSchema.parse(plugin));

  if (deps.disableReplacedPlugins !== false) {
    const [, disableErr] = await deps.pluginRepo.disablePlugins(replacedPluginIds);

    if (disableErr) {
      const failure = failureResult(
        {
          en: 'Failed to disable replaced plugins',
          'zh-CN': '禁用被替换插件失败'
        },
        disableErr
      )[1]!;
      deps.logger.error('Plugin Replace Active Disable Error', {
        replacedPluginIds,
        error: toUsecaseErrorLog(failure)
      });
      return [null, failure];
    }
  }

  await Promise.all(
    replacedRunnablePluginIds.map(async (uniqueId) => {
      try {
        const [, unregisterErr] = await deps.pluginRuntimeManager.unregister(uniqueId, {
          replacementUniqueId: deps.replacementUniqueId
        });
        if (unregisterErr) {
          deps.logger.error('Failed to unregister replaced plugin runtime', {
            pluginId: uniqueId.pluginId,
            version: uniqueId.version,
            etag: uniqueId.etag,
            error: toUsecaseErrorLog(unregisterErr)
          });
        }
      } catch (error) {
        deps.logger.error('Failed to unregister replaced plugin runtime', {
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
