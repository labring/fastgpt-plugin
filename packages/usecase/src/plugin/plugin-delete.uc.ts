import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema, type UserPluginIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginDeleteUCDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

export const makePluginDeleteUC =
  ({ logger, pluginRepo, pluginRuntimeManager }: PluginDeleteUCDeps) =>
  async (
    input: Required<Pick<UserPluginIdType, 'pluginId' | 'source' | 'version'>>
  ): Promise<Result> => {
    logger.debug('Plugin Delete', { input });

    const [plugin, pluginErr] = await pluginRepo.getPluginByUserPluginId(input);

    if (pluginErr) {
      return failureResult(
        {
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        },
        pluginErr
      );
    }

    const uniqueId = PluginUniqueIdSchema.parse(plugin);
    const [, disableErr] = await pluginRepo.disablePlugins([uniqueId]);

    if (disableErr) {
      return failureResult(
        {
          en: 'Failed to delete plugin',
          'zh-CN': '删除插件失败'
        },
        disableErr
      );
    }

    if (plugin.type === 'tool') {
      let unregisterErr;

      try {
        [, unregisterErr] = await pluginRuntimeManager.unregister(uniqueId);
      } catch (error) {
        unregisterErr = error;
      }

      if (unregisterErr) {
        logger.error('Failed to unregister deleted plugin runtime', {
          pluginId: uniqueId.pluginId,
          source: input.source,
          version: uniqueId.version,
          etag: uniqueId.etag,
          error: unregisterErr
        });
      }
    }

    return successResult({});
  };
