/**
 * Usecase Description
 * Description：Tool Run
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { ToolManagerPort } from '@domain/ports/plugin/tool.port';
import type { ToolRunInputType } from '@domain/value-objects/tool.vo';

/** Dependencies */
export type ToolRunUCDeps = {
  toolManager: ToolManagerPort;
};

export const makeToolRunUC =
  ({ toolManager }: ToolRunUCDeps) =>
  async (input: ToolRunInputType) => {
    return await toolManager.run(input);
  };
