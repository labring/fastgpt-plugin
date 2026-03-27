import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/env';

const getSecret = () => new TextEncoder().encode(env.JWT_SECRET);

export interface CallbackTokenPayload {
  traceId: string;
  toolId: string;
}

/**
 * 签发一个短期 JWT，用于插件反向调用时的鉴权凭证。
 * payload 中含 traceId（用于查找对应的 callbackRegistry 条目）和 toolId（审计用）。
 */
export const signCallbackToken = (traceId: string, toolId: string): Promise<string> =>
  new SignJWT({ traceId, toolId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret());

/**
 * 验证并解析 callbackToken。
 * 若 token 无效、已过期或签名不匹配，抛出错误。
 */
export const verifyCallbackToken = async (token: string): Promise<CallbackTokenPayload> => {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as CallbackTokenPayload;
};
