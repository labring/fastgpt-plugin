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

export type ToolDetailUCDeps = {
  toolManager: ToolManagerPort;
};

type Input = ToolDetailInputType;
type Output = Promise<Result<ToolDetailType>>;

export const makeToolDetailUC =
  ({ toolManager }: ToolDetailUCDeps) =>
  async (input: Input): Output => {
    return toolManager.detail(input);
  };
