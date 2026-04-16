/**
 * Usecase Description
 * Description：Get one plugin by uniqueId
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { UserPluginIdType } from '@domain/value-objects/plugin.vo';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
export type PluginGetOneDeps = {
  pluginRepo: PluginRepoPort;
};

/** Input Type*/
type Input = {
  userPluginId: UserPluginIdType;
};

/** Output Type */
type Output = Promise<Result<PluginType>>;

export const makePluginGetOneUC =
  (deps: PluginGetOneDeps) =>
  async (input: Input): Output => {
    const { userPluginId } = input;
    return deps.pluginRepo.getPluginByUserPluginId(userPluginId);
  };
