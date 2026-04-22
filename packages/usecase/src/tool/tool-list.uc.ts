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

export type ToolListUCDeps = {
  toolManager: ToolManagerPort;
};

type Input = ToolListInputType;
type Output = Promise<Result<ToolListOutputType>>;

export const makeToolListUC =
  ({ toolManager }: ToolListUCDeps) =>
  async (input: Input): Output => {
    return toolManager.list(input);
  };
