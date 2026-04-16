/**
 * Usecase Description
 * Description：List the models.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModelItemType } from '@domain/entities/model.entity';
import type { ModelManagerPort } from '@domain/ports/plugin/model.port';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
export type ModelListDeps = {
  modelManager: ModelManagerPort;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<ModelItemType[]>>;

export const makeModelListUC =
  (deps: ModelListDeps) =>
  async (_input: Input): Output => {
    return deps.modelManager.models();
  };
