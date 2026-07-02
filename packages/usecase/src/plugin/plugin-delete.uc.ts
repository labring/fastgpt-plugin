import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema, type UserPluginIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { isResultFailure, toUsecaseErrorLog } from '@usecase/log-error';
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

    const [resolvedPlugin, pluginErr] = await pluginRepo.getPluginByUserPluginId(input);

    if (pluginErr) {
      logger.error('Plugin Delete Detail Error', toUsecaseErrorLog(pluginErr, { input }));
      return failureResult(
        {
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        },
        pluginErr
      );
    }

    const [deleteResult, deleteErr] = await pluginRepo.deletePluginInstallation(input);

    if (deleteErr) {
      logger.error('Plugin Delete Installation Error', {
        input,
        error: toUsecaseErrorLog(deleteErr)
      });
      return failureResult(
        {
          en: 'Failed to delete plugin',
          'zh-CN': '删除插件失败'
        },
        deleteErr
      );
    }

    const plugin = deleteResult?.plugin ?? resolvedPlugin;
    const uniqueId = PluginUniqueIdSchema.parse(plugin);

    if (deleteResult?.disabled && plugin.type === 'tool') {
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
          error: isResultFailure(unregisterErr) ? toUsecaseErrorLog(unregisterErr) : unregisterErr
        });
      }
    }

    return successResult({});
  };
