/**
 * Usecase Description
 * Description：Search the plugin.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginTagType, PluginType, PluginTypeType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
type Deps = {
  pluginRepo: PluginRepoPort;
};

/** Input Type*/
type Input = {
  types?: PluginTypeType[];
  tags?: PluginTagType[];
  op?: 'or' | 'and';
};

/** Output Type */
type Output = Promise<Result<PluginType[]>>;

export const makePluginListUC =
  ({ pluginRepo }: Deps) =>
  async ({ op, tags, types }: Input): Output => {
    return pluginRepo.list({
      types,
      op,
      tags
    });
  };
