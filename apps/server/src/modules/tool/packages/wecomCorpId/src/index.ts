import { z } from 'zod';
import { getCorpToken } from '@/invoke/wecom/getAuthToken';
import type { RunToolSecondParamsType } from '@tool/type/req';

export const InputType = z.object({});

export const OutputType = z.object({
  access_token: z.string(),
  expires_in: z.number()
});

export async function tool(
  _params: z.infer<typeof InputType>,
  { systemVar }: RunToolSecondParamsType
): Promise<z.infer<typeof OutputType>> {
  // 调用 wecom.getAuthToken 获取企业微信授权 token
  // const result = await invoke<getCorpTokenResult>('wecom.getCorpToken');
  const result = await getCorpToken({}, systemVar);

  return {
    access_token: result.access_token,
    expires_in: result.expires_in
  };
}
