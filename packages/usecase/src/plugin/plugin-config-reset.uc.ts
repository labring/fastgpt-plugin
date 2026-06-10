/**
 * Usecase Description
 * Description：Reset PluginConfig for a plugin.
 * Version：v1.0.0
 * Author：FinleyGe
 */
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type PluginConfigResetUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = {
  pluginId: string;
};

/** Output Type */
type Output = Promise<Result>;

export const makeResetPluginConfigUC =
  ({ logger, pluginRuntimeManager }: PluginConfigResetUCDeps) =>
  async ({ pluginId }: Input): Output => {
    logger.debug('Plugin Config Reset', { pluginId });
    const [result, error] = await pluginRuntimeManager.resetConfig(pluginId);
    if (error) {
      logger.error('Plugin Config Reset Error', toUsecaseErrorLog(error, { pluginId }));
      return failureResult(error);
    }
    return successResult(result);
  };
