/**
 * Usecase Description
 * Description：Tool List
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type {
  ToolListInputType,
  ToolListOutputType,
  ToolManagerPort
} from '@domain/ports/plugin/tool.port';
import type { Result } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

export type ToolListUCDeps = {
  toolManager: ToolManagerPort;
  logger: UsecaseLogger;
};

type Input = ToolListInputType;
type Output = Promise<Result<ToolListOutputType>>;

export const makeToolListUC =
  ({ logger, toolManager }: ToolListUCDeps) =>
  async (input: Input): Output => {
    logger.debug('Tool List', { input });
    return toolManager.list(input);
  };
