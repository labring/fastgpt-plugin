import type {
  PluginDeleteInputType,
  PluginRepoPort
} from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema } from '@domain/value-objects/plugin.vo';
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
  async (input: PluginDeleteInputType): Promise<Result> => {
    logger.debug('Plugin Delete', { input });

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

    for (const { plugin, disabled } of deleteResult.plugins) {
      if (!disabled || plugin.type !== 'tool') continue;
      const uniqueId = PluginUniqueIdSchema.parse(plugin);
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
