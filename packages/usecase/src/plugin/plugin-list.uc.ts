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
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
type Deps = {
  pluginRepo: PluginRepoPort;
};

/** Input Type*/
type Input = PluginListInputType;

/** Output Type */
type Output = Promise<Result<PluginListOutputType>>;

export const makePluginListUC =
  ({ pluginRepo }: Deps) =>
  async (input: Input): Output => {
    return pluginRepo.list(input);
  };
