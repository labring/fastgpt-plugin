/**
 * Usecase Description
 * Description：Reset PluginConfig for a plugin.
 * Version：v1.0.0
 * Author：FinleyGe
 */
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { Result } from '@domain/value-objects/result.vo';
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
    return pluginRuntimeManager.resetConfig(pluginId);
  };
