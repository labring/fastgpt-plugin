import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginPruneDisabledUCDeps = {
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
};

export const makePluginPruneDisabledUC =
  ({ logger, pluginRepo }: PluginPruneDisabledUCDeps) =>
  async () => {
    logger.debug('Plugin Prune Disabled');
    return pluginRepo.pruneDisabled();
  };
