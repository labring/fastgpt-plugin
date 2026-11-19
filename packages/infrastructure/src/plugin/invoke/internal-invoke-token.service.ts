import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';

import type { InternalPluginInvokeTokenIssuerPort, IssueInternalPluginInvokeTokenInput } from '@domain/ports/plugin/internal-plugin-invoke-token.port';

const TOKEN_VERSION = 'fgpit1';
const TOKEN_AAD = Buffer.from('fastgpt-plugin-invoke:v1');
const TOKEN_TTL_MS = 30_000;
const TOKEN_ISSUER = 'fastgpt-plugin-invoke';
const ALLOWED_METHODS = ['userInfo', 'uploadFile', 'wecomCorpToken'] as const;

export type InternalPluginInvokeMethod = (typeof ALLOWED_METHODS)[number];

export type InternalPluginInvokeTokenClaims = {
  iss: typeof TOKEN_ISSUER;
  jti: string;
  tenantId: string;
  pluginId: string;
  invocationId: string;
  invokeToken: string;
  methods: InternalPluginInvokeMethod[];
  iat: number;
  exp: number;
};

export class InternalPluginInvokeTokenService implements InternalPluginInvokeTokenIssuerPort {
  constructor(
    private readonly secret: string,
    private readonly ttlMs = TOKEN_TTL_MS
  ) {
    if (secret.length < 32) throw new Error('Internal plugin invoke token secret must be at least 32 characters');
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > TOKEN_TTL_MS) {
      throw new Error(`Internal plugin invoke token TTL must be between 1 and ${TOKEN_TTL_MS} ms`);
    }
  }

  issue(input: IssueInternalPluginInvokeTokenInput, now = Date.now()): string {
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('Invalid token issue time');
    for (const key of ['tenantId', 'pluginId', 'invocationId', 'invokeToken'] as const) {
      const value = input[key];
      if (
        typeof value !== 'string' ||
        value.length === 0 ||
        value.length > (key === 'invokeToken' ? 4096 : 256)
      ) {
        throw new Error(`Internal plugin invoke token ${key} is required`);
      }
    }
    const claims: InternalPluginInvokeTokenClaims = {
      iss: TOKEN_ISSUER,
      jti: randomUUID(),
      tenantId: input.tenantId,
      pluginId: input.pluginId,
      invocationId: input.invocationId,
      invokeToken: input.invokeToken,
      methods: [...ALLOWED_METHODS],
      iat: now,
      exp: now + this.ttlMs
    };
    // Authenticated encryption keeps the upstream credential unreadable to Workers.
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    cipher.setAAD(TOKEN_AAD);
    const payload = Buffer.concat([cipher.update(JSON.stringify(claims), 'utf8'), cipher.final()]);
    return [TOKEN_VERSION, iv.toString('base64url'), payload.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
  }

  verify(
    token: string,
    input: {
      method: string;
      tenantId?: string;
      pluginId?: string;
      invocationId?: string;
      now?: number;
    }
  ): InternalPluginInvokeTokenClaims {
    if (token.length > 16_384) throw new Error('Invalid internal plugin invoke token');
    const [version, iv, payload, tag, extra] = token.split('.');
    let claims: unknown;
    try {
      if (version !== TOKEN_VERSION || !iv || !payload || !tag || extra !== undefined) throw new Error();
      const nonce = Buffer.from(iv, 'base64url');
      const authTag = Buffer.from(tag, 'base64url');
      if (nonce.length !== 12 || authTag.length !== 16) throw new Error();
      const decipher = createDecipheriv('aes-256-gcm', this.key(), nonce);
      decipher.setAAD(TOKEN_AAD);
      decipher.setAuthTag(authTag);
      claims = JSON.parse(Buffer.concat([
        decipher.update(Buffer.from(payload, 'base64url')), decipher.final()
      ]).toString('utf8'));
    } catch {
      throw new Error('Invalid internal plugin invoke token');
    }
    if (!isClaims(claims)) throw new Error('Invalid internal plugin invoke token');

    const now = input.now ?? Date.now();
    if (claims.exp <= now || claims.iat > now + 5_000 || claims.exp <= claims.iat || claims.exp - claims.iat > TOKEN_TTL_MS) {
      throw new Error('Expired internal plugin invoke token');
    }
    if (!claims.methods.includes(input.method as InternalPluginInvokeMethod)) {
      throw new InternalPluginInvokeForbiddenError('Internal plugin invoke capability denied');
    }
    if (
      (input.tenantId !== undefined && claims.tenantId !== input.tenantId) ||
      (input.pluginId !== undefined && claims.pluginId !== input.pluginId) ||
      (input.invocationId !== undefined && claims.invocationId !== input.invocationId)
    ) {
      throw new InternalPluginInvokeForbiddenError('Internal plugin invoke token scope mismatch');
    }
    return claims;
  }

  private key(): Buffer {
    return createHash('sha256').update(TOKEN_AAD).update(this.secret).digest();
  }
}

function isClaims(value: unknown): value is InternalPluginInvokeTokenClaims {
  return (
    isRecord(value) &&
    value.iss === TOKEN_ISSUER &&
    typeof value.jti === 'string' &&
    value.jti.length > 0 &&
    typeof value.tenantId === 'string' &&
    value.tenantId.length > 0 &&
    typeof value.pluginId === 'string' &&
    value.pluginId.length > 0 &&
    typeof value.invocationId === 'string' &&
    value.invocationId.length > 0 &&
    typeof value.invokeToken === 'string' &&
    value.invokeToken.length > 0 &&
    Array.isArray(value.methods) &&
    value.methods.every((method) => ALLOWED_METHODS.includes(method)) &&
    Number.isSafeInteger(value.iat) &&
    Number.isSafeInteger(value.exp)
  );
}

export class InternalPluginInvokeForbiddenError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
