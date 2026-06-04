/**
 * Usecase Description
 * Description：Get the providers.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModelProviderType } from '@domain/entities/model.entity';
import type { ModelManagerPort } from '@domain/ports/plugin/model.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
/** Dependencies */
export type ProviderListDeps = {
  modelManager: ModelManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<ModelProviderType[]>>;

export const makeProviderListUC =
  ({ logger, modelManager }: ProviderListDeps) =>
  async (input: Input): Output => {
    logger.debug('Provider List', { input });
    const [result, error] = await modelManager.providers();
    if (error) {
      logger.error('Provider List Error', error);
      return failureResult(error);
    }
    return successResult(result);
  };
