import type { RunToolSecondParamsType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { z } from 'zod';
import { InputType, OutputType } from './schemas';

export async function tool(
  _input: z.infer<typeof InputType>,
  _ctx: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  return { message: 'Hello from postgresql' };
}
