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
import type { Result } from '@domain/value-objects/result.vo';

type PluginVersionsDeps = {
  pluginRepo: PluginRepoPort;
};

type Input = PluginVersionListInputType;

type Output = Promise<Result<PluginVersionListOutputType>>;

export const makePluginVersionsUC =
  ({ pluginRepo }: PluginVersionsDeps) =>
  async (input: Input): Output => {
    return pluginRepo.listVersions(input);
  };
