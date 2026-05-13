/**
 * Usecase Description
 * Description：List the models.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModelItemType } from '@domain/entities/model.entity';
import type { ModelManagerPort } from '@domain/ports/plugin/model.port';
import type { Result } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
/** Dependencies */
export type ModelListDeps = {
  modelManager: ModelManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<ModelItemType[]>>;

export const makeModelListUC =
  ({ logger, modelManager }: ModelListDeps) =>
  async (_input: Input): Output => {
    logger.debug('Model List');
    return modelManager.models();
  };
