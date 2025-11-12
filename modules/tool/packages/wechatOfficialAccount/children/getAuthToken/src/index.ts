import { z } from 'zod';
import { handleGetAuthToken } from '../../../lib/handler';
import { addLog } from '@/utils/log';

export const InputType = z.object({
  appId: z.string().min(1, 'AppID 不能为空'),
  secret: z.string().min(1, 'AppSecret 不能为空')
});

export const OutputType = z.object({
  access_token: z.string(),
  expires_in: z.number()
});

export async function tool({
  appId: appid,
  secret
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const data = await handleGetAuthToken({
    appid,
    secret,
    grant_type: 'client_credential'
  });

  addLog.debug(`access_token: ${JSON.stringify(data, null, 2)}`);

  return {
    access_token: data.access_token,
    expires_in: data.expires_in
  };
}
