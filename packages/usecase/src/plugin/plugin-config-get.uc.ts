/**
 * Usecase Description
 * Description：Get the PluginConfig for a plugin
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type PluginConfigGetUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = {
  pluginId: string;
};

/** Output Type */
type Output = Promise<Result<PluginRuntimeConfigType>>;

export const makePluginConfigGetUC =
  ({ logger, pluginRuntimeManager }: PluginConfigGetUCDeps) =>
  async ({ pluginId }: Input): Output => {
    logger.debug('Plugin Config Get', { pluginId });
    const [result, error] = await pluginRuntimeManager.getConfig(pluginId);
    if (error) {
      logger.error('Plugin Config Get Error', toUsecaseErrorLog(error, { pluginId }));
      return failureResult(error);
    }
    return successResult(result);
  };
