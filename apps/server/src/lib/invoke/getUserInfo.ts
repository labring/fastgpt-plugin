import { z } from 'zod';
import type { SystemVarType } from '@tool/type/req';
import { getAccessToken } from './accessToken';
import { FastGPTBaseURL } from './const';

// 参数校验
export const getCorpTokenParamsSchema = z.object({});

export type getUserInfoParamsType = z.infer<typeof getCorpTokenParamsSchema>;

// 返回值类型
export type getUserInfoResult = {
  username: string;
  memberName: string;
  contact?: string;
  orgs: {
    pathId: string;
    name: string;
  }[];
  groups: {
    name: string;
  }[];
};

export async function getUserInfo(
  params: getUserInfoParamsType,
  systemVar: SystemVarType
): Promise<getUserInfoResult> {
  // 验证参数
  const access_token = await getAccessToken({}, systemVar);

  // 调用 FastGPT API
  const url = new URL('/api/invoke/userInfo', FastGPTBaseURL);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${access_token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  const result = (await response.json()) as {
    data: getUserInfoResult;
  };

  return result.data;
}
