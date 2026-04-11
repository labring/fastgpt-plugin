/**
 * Usecase Description
 * Description：Set PluginConfig for a plugin all version.
 * Version：v1.0.0
 * Author：FinleyGe
 */
import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { Result } from '@domain/value-objects/result.vo';

/** Dependencies */
export type PluginConfigSetUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
};

/** Input Type*/
type Input<T extends PluginRuntimeConfigType> = {
  pluginId: string;
  config: T;
};

/** Output Type */
type Output = Promise<Result>;

export const makeSetPluginConfigUC =
  <T extends PluginRuntimeConfigType>({ pluginRuntimeManager }: PluginConfigSetUCDeps) =>
  async (input: Input<T>): Output => {
    return pluginRuntimeManager.updateConfig(input.pluginId, input.config);
  };
