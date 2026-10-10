/**
 * Usecase Description
 * Description：Moderation Check
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModerationManagerPort } from '@domain/ports/plugin/moderation.port';
import type {
  ModerationCheckRunInputType,
  ModerationResultType
} from '@domain/value-objects/moderation.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type ModerationCheckUCDeps = {
  moderationManager: ModerationManagerPort;
  logger: UsecaseLogger;
};

type Output = Promise<Result<ModerationResultType>>;

export const makeModerationCheckUC =
  ({ moderationManager, logger }: ModerationCheckUCDeps) =>
  async (input: ModerationCheckRunInputType): Output => {
    logger.debug('Moderation Check', { input: toModerationCheckLogInput(input) });
    const [result, error] = await moderationManager.check(input);
    if (error) {
      logger.error(
        'Moderation Check Error',
        toUsecaseErrorLog(error, { input: toModerationCheckLogInput(input) })
      );
      return failureResult(error);
    }

    // Block and provider errors should be visible operational signals.
    const logInput = {
      ...toModerationCheckLogInput(input),
      verdict: result.verdict
    };
    if (result.verdict === 'block' || result.verdict === 'error') {
      logger.warn('Moderation Check Result', logInput);
    } else {
      logger.info('Moderation Check Result', logInput);
    }

    return successResult(result);
  };

/** 审查内容全文不得进入日志 */
function toModerationCheckLogInput(input: ModerationCheckRunInputType): Record<string, unknown> {
  return {
    pluginId: input.pluginId,
    source: input.source ?? 'system',
    ...(input.version ? { version: input.version } : {}),
    ...(input.input.partial === undefined ? {} : { partial: input.input.partial }),
    ...(input.input.scene ? { scene: input.input.scene } : {}),
    hasSecrets: Boolean(input.secrets && Object.keys(input.secrets).length > 0),
    systemVar: {
      app: input.systemVar.app,
      chat: input.systemVar.chat,
      time: input.systemVar.time
    }
  };
}
