import type { SystemVarType } from '@tool/type/tool';
import { z } from 'zod';

export const InputType = z.object({});

export const OutputType = z.object({
  time: z.string()
});

export async function tool(
  props: z.infer<typeof InputType>,
  systemVar: SystemVarType
): Promise<z.infer<typeof OutputType>> {
  return {
    time: systemVar.time
  };
}
