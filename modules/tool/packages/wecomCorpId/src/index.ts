import { z } from 'zod';
import { invoke } from '@/invoke';
import type { getCorpTokenResult } from '@/invoke/wecom/getAuthToken';

export const InputType = z.object({});

export const OutputType = z.object({
  access_token: z.string(),
  expires_in: z.number()
});

export async function tool(): Promise<z.infer<typeof OutputType>> {
  // 调用 wecom.getAuthToken 获取企业微信授权 token
  const result = await invoke<getCorpTokenResult>('wecom.getCorpToken');

  return {
    access_token: result.access_token,
    expires_in: result.expires_in
  };
}
