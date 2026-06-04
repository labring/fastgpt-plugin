/**
 * Usecase Description
 * Description：Search the plugin.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type {
  PluginListInputType,
  PluginListOutputType,
  PluginRepoPort
} from '@domain/ports/plugin/plugin-repo.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
/** Dependencies */
type Deps = {
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = PluginListInputType;

/** Output Type */
type Output = Promise<Result<PluginListOutputType>>;

export const makePluginListUC =
  ({ logger, pluginRepo }: Deps) =>
  async (input: Input): Output => {
    logger.debug('Plugin List', { input });
    const [result, error] = await pluginRepo.list(input);
    if (error) {
      logger.error('Plugin List Error', error);
      return failureResult(error);
    }
    return successResult(result);
  };
