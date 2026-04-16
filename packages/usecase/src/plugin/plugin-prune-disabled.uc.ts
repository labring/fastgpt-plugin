import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';

export type PluginPruneDisabledUCDeps = {
  pluginRepo: PluginRepoPort;
};

export const makePluginPruneDisabledUC =
  ({ pluginRepo }: PluginPruneDisabledUCDeps) =>
  async () => {
    return pluginRepo.pruneDisabled();
  };
