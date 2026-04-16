import { delay } from '@fastgpt-plugin/helpers';
import type { ToolContextType } from '@fastgpt-plugin/helpers/tools/schemas/req';

import type { Input, Output } from './schemas';

export async function handler(_: Input, ctx: ToolContextType): Promise<Output> {
  await delay(5000);
  return {};
}
