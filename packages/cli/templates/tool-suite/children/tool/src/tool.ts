import type { ToolContextType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { Input, Output } from './schemas';

export async function handler(_: Input, ctx: ToolContextType): Promise<Output> {
  const { systemVar } = ctx;

  return { time: systemVar.time };
}
