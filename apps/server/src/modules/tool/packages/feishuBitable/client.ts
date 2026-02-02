import axios, { type AxiosInstance } from 'axios';
import type { FeishuResponse } from './types';
import { getErrText } from '@tool/utils/err';

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * Token 缓存
 */
interface TokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCache>();

/**
 * 获取租户访问令牌 (tenant_access_token)
 */
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  // const cacheKey = `${appId}:${appSecret}`;
  // const cached = tokenCache.get(cacheKey);

  // // 如果缓存存在且未过期（提前5分钟刷新）
  // if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
  //   return cached.token;
  // }

  try {
    // 飞书认证API的响应格式特殊,不使用标准的 FeishuResponse 结构
    const response = await axios.post<{
      code: number;
      msg: string;
      tenant_access_token?: string;
      expire?: number;
    }>(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
      app_id: appId,
      app_secret: appSecret
    });

    // 检查响应
    if (!response.data) {
      throw new Error('Invalid response from Feishu API: no data');
    }

    if (response.data.code !== 0) {
      throw new Error(
        `Feishu auth failed [${response.data.code}]: ${response.data.msg || 'Unknown error'}`
      );
    }

    const tenant_access_token = response.data.tenant_access_token;
    const expire = response.data.expire || 7200;

    if (!tenant_access_token) {
      throw new Error('Invalid response: no tenant_access_token in response');
    }

    // 缓存 token
    // tokenCache.set(cacheKey, {
    //   token: tenant_access_token,
    //   expiresAt: Date.now() + expire * 1000
    // });

    return tenant_access_token;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to authenticate with Feishu: ${error.message}`);
    }
    throw new Error('Failed to authenticate with Feishu: Unknown error');
  }
}

/**
 * 创建飞书 API 客户端（使用 appId 和 appSecret）
 */
export async function createFeishuClient(appId: string, appSecret: string): Promise<AxiosInstance> {
  // 获取访问令牌
  const accessToken = await getTenantAccessToken(appId, appSecret);
  const client = axios.create({
    baseURL: FEISHU_API_BASE,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      const data = response.data as FeishuResponse;
      if (data.code === 0) {
        return response;
      }
      return Promise.reject(new Error(`Feishu API Error [${data.code}]: ${data.msg}`));
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
}
