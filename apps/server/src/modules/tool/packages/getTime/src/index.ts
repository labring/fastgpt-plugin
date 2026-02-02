import { z } from 'zod';
import type { RunToolSecondParamsType } from '@tool/type/req';

export const InputType = z.object({});

export const OutputType = z.object({
  time: z.string()
});

export async function tool(
  props: z.infer<typeof InputType>,
  { systemVar }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  return {
    time: systemVar.time
  };
}
