import { FastGPTBaseURL } from './const';
import type { SystemVarType } from '@tool/type/req';
import { getLogger, root } from '@/logger';
import { env } from '@/env';

const logger = getLogger(root);

type RequestAccessTokenBody = {
  toolId: string;
  teamId: string;
  tmbId: string;
};

async function requestAccessToken(body: RequestAccessTokenBody): Promise<string> {
  const url = new URL('/api/plugin/getAccessToken', FastGPTBaseURL);
  logger.debug('getAccessToken', { body: { url } });
  const res = (await fetch(url, {
    headers: {
      authtoken: env.AUTH_TOKEN,
      'content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(body)
  }).then((res) => res.json())) as { data: { accessToken: string } };

  logger.debug('getAccessToken', { body: { data: res.data } });
  if (res.data.accessToken) {
    return res.data.accessToken;
  }

  throw new Error('Failed to get access token');
}

async function getAccessToken(params: any, systemVar: SystemVarType): Promise<string> {
  return await requestAccessToken({
    toolId: systemVar.tool.id,
    teamId: systemVar.user.teamId,
    tmbId: systemVar.user.id
  });
}

export { getAccessToken, requestAccessToken };
