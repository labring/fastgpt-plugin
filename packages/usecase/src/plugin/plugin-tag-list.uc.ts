/**
 * Usecase Description
 * Description：Get Plugin Tags
 * Version：v1.0.0
 * Author：FinleyGe
 */

// import type { PluginManagerPort } from '@domain/ports/plugin/plugin.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginTagListType } from '@domain/value-objects/plugin.vo';
import type { Result } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
/** Dependencies */
type Deps = {
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
  // plugin: PluginManagerPort;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<PluginTagListType>>;

export const makePluginTagListUC =
  ({ logger, pluginRepo }: Deps) =>
  async (_input: Input): Output => {
    logger.debug('Plugin Tag List');
    return pluginRepo.listTags();
  };
