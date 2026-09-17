/**
 * Usecase Description
 * Description：Moderation Check
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ModerationManagerPort } from '@domain/ports/plugin/moderation.port';
import type {
  ModerationCheckResultType,
  ModerationCheckRunInputType
} from '@domain/value-objects/moderation.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type ModerationCheckUCDeps = {
  moderationManager: ModerationManagerPort;
  logger: UsecaseLogger;
};

type Output = Promise<Result<ModerationCheckResultType>>;

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

    // verdict 仅在 done 分支存在；block / error 是运维需要被发现的信号。
    // status 目前恒为 done，接入异步 provider 后再补 pending 分支。
    const logInput = {
      ...toModerationCheckLogInput(input),
      verdict: result.result.verdict
    };
    if (result.result.verdict === 'block' || result.result.verdict === 'error') {
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
    modality: input.input.modality,
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
