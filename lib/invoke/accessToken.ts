import { FastGPTBaseURL } from './const';
import type { SystemVarType } from '@tool/type/req';
import { registerInvokeHandler } from './registry';
import { addLog } from '@/utils/log';

// type GetAccessTokenParams = {
//   // Currently no additional params needed
//   // Future: could add scope, permissions, etc.
// };

type RequestAccessTokenBody = {
  toolId: string;
  teamId: string;
  tmbId: string;
};

async function requestAccessToken(body: RequestAccessTokenBody): Promise<string> {
  const url = new URL('/api/plugin/getAccessToken', FastGPTBaseURL);
  addLog.debug('getAccessToken', { url });
  const res = (await fetch(url, {
    headers: {
      authtoken: process.env.AUTH_TOKEN || '',
      'content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(body)
  }).then((res) => res.json())) as { data: { accessToken: string } };

  addLog.debug('getAccessToken', res.data);
  if (res.data.accessToken) {
    return res.data.accessToken;
  }

  throw new Error('Failed to get access token');
}

async function getAccessToken(params: any, systemVar: SystemVarType): Promise<string> {
  return await requestAccessToken({
    toolId: systemVar.tool.id,
    teamId: systemVar.user.teamId,
    tmbId: systemVar.user.membername
  });
}

// Register the method
registerInvokeHandler('getAccessToken', getAccessToken);

export { getAccessToken, requestAccessToken };
