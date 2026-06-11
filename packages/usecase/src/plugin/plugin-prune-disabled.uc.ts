import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginPruneDisabledUCDeps = {
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
};

export const makePluginPruneDisabledUC =
  ({ logger, pluginRepo }: PluginPruneDisabledUCDeps) =>
  async () => {
    logger.debug('Plugin Prune Disabled');
    const [result, error] = await pluginRepo.pruneDisabled();
    if (error) {
      logger.error('Plugin Prune Disabled Error', toUsecaseErrorLog(error));
      return failureResult(error);
    }
    return successResult(result);
  };
