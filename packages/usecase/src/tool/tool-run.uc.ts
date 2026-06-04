/**
 * Usecase Description
 * Description：Tool Run
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
import { failureResult, type Result,successResult } from '@domain/value-objects/result.vo';
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
    logger.debug('Tool Run', { input });
    const [result, error] = await toolManager.run(input);
    if (error) {
      logger.error('Tool Run Error', error);
      return failureResult(error);
    }
    return successResult(result);
  };
