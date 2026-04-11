/**
 * Usecase Description
 * Description：Get the PluginConfig for a plugin
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { Result } from '@domain/value-objects/result.vo';

/** Dependencies */
export type PluginConfigGetUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
};

/** Input Type*/
type Input = {
  pluginId: string;
};

/** Output Type */
type Output = Promise<Result<PluginRuntimeConfigType>>;

export const makePluginConfigGetUC =
  (deps: PluginConfigGetUCDeps) =>
  async ({ pluginId }: Input): Output => {
    return deps.pluginRuntimeManager.getConfig(pluginId);
  };
