import { getUserInfo } from '@/invoke/getUserInfo';
import type { RunToolSecondParamsType } from '@tool/type/req';
import { z } from 'zod';

export const InputType = z.object({});

export const OutputType = z.object({
  username: z.string(),
  memberName: z.string(),
  contact: z.string().optional(),
  orgs: z.array(
    z.object({
      pathId: z.string(),
      name: z.string()
    })
  ),
  groups: z.array(
    z.object({
      name: z.string()
    })
  )
});

export async function tool(
  _input: z.infer<typeof InputType>,
  { systemVar }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  const result = await getUserInfo({}, systemVar);
  return result;
}
