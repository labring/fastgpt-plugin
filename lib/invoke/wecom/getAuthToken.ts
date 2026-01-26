import { z } from 'zod';
import { registerInvokeHandler } from '../registry';
import type { SystemVarType } from '@tool/type/req';
import { FastGPTBaseURL } from '../const';
import { getAccessToken } from '../accessToken';

// 参数校验
const getCorpTokenParamsSchema = z.object({});

type getCorpTokenParams = z.infer<typeof getCorpTokenParamsSchema>;

// 返回值类型
type getCorpTokenResult = {
  access_token: string;
  expires_in: number;
};

/**
 * 获取企业微信授权 token
 *
 * @param params.corpId - 企业微信 corpId
 * @returns access_token 和过期时间
 */
async function getCorpToken(
  params: getCorpTokenParams,
  systemVar: SystemVarType
): Promise<getCorpTokenResult> {
  // 验证参数
  // const validated = getCorpTokenParamsSchema.parse(params);
  const access_token = await getAccessToken({}, systemVar);

  // 调用 FastGPT API
  const url = new URL('/api/proApi/support/wecom/getCorpToken', FastGPTBaseURL);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${access_token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get auth token: ${response.statusText}`);
  }

  const result = (await response.json()) as {
    data: {
      access_token: string;
      expires_in: number;
    };
  };

  if (!result.data.access_token) {
    throw new Error('Invalid response: missing access_token');
  }

  return result.data;
}

// 注册方法
registerInvokeHandler('wecom.getCorpToken', getCorpToken);

export { getCorpToken };
export type { getCorpTokenParams, getCorpTokenResult };
