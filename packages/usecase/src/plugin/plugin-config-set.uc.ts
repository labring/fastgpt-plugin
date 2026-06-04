/**
 * Usecase Description
 * Description：Set PluginConfig for a plugin all version.
 * Version：v1.0.0
 * Author：FinleyGe
 */
import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type PluginConfigSetUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input<T extends PluginRuntimeConfigType> = {
  pluginId: string;
  config: T;
};

/** Output Type */
type Output = Promise<Result>;

export const makeSetPluginConfigUC =
  <T extends PluginRuntimeConfigType>({ logger, pluginRuntimeManager }: PluginConfigSetUCDeps) =>
  async (input: Input<T>): Output => {
    logger.debug('Plugin Config Set', { input });
    const [result, error] = await pluginRuntimeManager.updateConfig(input.pluginId, input.config);
    if (error) {
      logger.error('Plugin Config Set Error', error);
      return failureResult(error);
    }
    return successResult(result);
  };
