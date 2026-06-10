/**
 * Usecase Description
 * Description：List all versions of a plugin under the given source.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type {
  PluginRepoPort,
  PluginVersionListInputType,
  PluginVersionListOutputType
} from '@domain/ports/plugin/plugin-repo.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

type PluginVersionsDeps = {
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
};

type Input = PluginVersionListInputType;

type Output = Promise<Result<PluginVersionListOutputType>>;

export const makePluginVersionsUC =
  ({ logger, pluginRepo }: PluginVersionsDeps) =>
  async (input: Input): Output => {
    logger.debug('Plugin Versions', { input });
    const [result, error] = await pluginRepo.listVersions(input);
    if (error) {
      logger.error('Plugin Versions Error', toUsecaseErrorLog(error, { input }));
      return failureResult(error);
    }
    return successResult(result);
  };
