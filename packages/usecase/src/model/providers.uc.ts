/**
 * Usecase Description
 * Description：Get the providers.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModelProviderType } from '@domain/entities/model.entity';
import type { ModelManagerPort } from '@domain/ports/plugin/model.port';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
export type ProviderListDeps = {
  modelManager: ModelManagerPort;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<ModelProviderType[]>>;

export const makeProviderListUC =
  (deps: ProviderListDeps) =>
  async (input: Input): Output => {
    return deps.modelManager.providers();
  };
