/**
 * Usecase Description
 * Description：Tool Run
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';
import type { ToolRunInputType, ToolStreamMessageType } from '@domain/value-objects/tool.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type ToolRunUCDeps = {
  toolManager: ToolManagerPort;
  logger: UsecaseLogger;
};

type Output = Promise<Result<StreamData<ToolStreamMessageType>>>;

export const makeToolRunUC =
  ({ toolManager, logger }: ToolRunUCDeps) =>
  async (input: ToolRunInputType): Output => {
    logger.debug('Tool Run', { input: toToolRunLogInput(input) });
    const [result, error] = await toolManager.run(input);
    if (error) {
      logger.error('Tool Run Error', {
        ...error,
        input: toToolRunLogInput(input)
      });
      return failureResult(error);
    }
    return successResult(result);
  };

function toToolRunLogInput(input: ToolRunInputType): Record<string, unknown> {
  return {
    pluginId: input.pluginId,
    source: input.source ?? 'system',
    ...(input.version ? { version: input.version } : {}),
    ...(input.childId ? { childId: input.childId } : {}),
    input: input.input,
    hasSecrets: Boolean(input.secrets && Object.keys(input.secrets).length > 0),
    systemVar: {
      app: input.systemVar.app,
      chat: input.systemVar.chat,
      time: input.systemVar.time
    }
  };
}
