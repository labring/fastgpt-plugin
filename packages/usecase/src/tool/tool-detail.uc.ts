/**
 * Usecase Description
 * Description：Tool Detail
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type {
  ToolDetailInputType,
  ToolDetailType,
  ToolManagerPort
} from '@domain/ports/plugin/tool.port';
import type { Result } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

export type ToolDetailUCDeps = {
  toolManager: ToolManagerPort;
  logger: UsecaseLogger;
};

type Input = ToolDetailInputType;
type Output = Promise<Result<ToolDetailType>>;

export const makeToolDetailUC =
  ({ logger, toolManager }: ToolDetailUCDeps) =>
  async (input: Input): Output => {
    logger.debug('Tool Detail', { input });
    return toolManager.detail(input);
  };
