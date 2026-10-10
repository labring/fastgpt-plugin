/**
 * Usecase Description
 * Description：Moderation Detail
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type {
  ModerationDetailInputType,
  ModerationDetailType,
  ModerationManagerPort
} from '@domain/ports/plugin/moderation.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

export type ModerationDetailUCDeps = {
  moderationManager: ModerationManagerPort;
  logger: UsecaseLogger;
};

type Input = ModerationDetailInputType;
type Output = Promise<Result<ModerationDetailType>>;

export const makeModerationDetailUC =
  ({ logger, moderationManager }: ModerationDetailUCDeps) =>
  async (input: Input): Output => {
    logger.debug('Moderation Detail', { input });
    const [result, error] = await moderationManager.detail(input);
    if (error) {
      logger.error('Moderation Detail Error', toUsecaseErrorLog(error, { input }));
      return failureResult(error);
    }
    return successResult(result);
  };
