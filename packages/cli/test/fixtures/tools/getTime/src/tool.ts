import type { RunToolSecondParamsType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { z } from 'zod';
import { InputType, OutputType } from './schemas';

export async function tool(
  _input: z.infer<typeof InputType>,
  { systemVar }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  return {
    time: systemVar.time
  };
}
