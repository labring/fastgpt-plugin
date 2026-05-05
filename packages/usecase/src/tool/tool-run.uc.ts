/**
 * Usecase Description
 * Description：Tool Run
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
import type { ToolRunInputType } from '@domain/value-objects/tool.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

/** Dependencies */
export type ToolRunUCDeps = {
  toolManager: ToolManagerPort;
  logger: UsecaseLogger;
};

export const makeToolRunUC =
  ({ toolManager, logger }: ToolRunUCDeps) =>
  async (input: ToolRunInputType) => {
    logger.debug('Tool Run', { input });
    return await toolManager.run(input);
  };
