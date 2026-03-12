import type { ToolContextType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { Input, Output } from './schemas';
import { delay } from '@fastgpt-plugin/helpers';

export async function handler(_: Input, ctx: ToolContextType): Promise<Output> {
  await delay(5000);
  return {};
}
