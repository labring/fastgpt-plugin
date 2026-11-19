import { describe, expect, it } from 'vitest';

import { InternalPluginInvokeTokenService } from './internal-invoke-token.service';

const input = {
  tenantId: 'system',
  pluginId: 'example',
  invocationId: 'invoke-1',
  invokeToken: 'host-context-token'
};

describe('InternalPluginInvokeTokenService', () => {
  it('issues a short-lived token bound to the invocation and method capabilities', () => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    const token = service.issue(input, 10_000);

    expect(service.verify(token, { method: 'userInfo', now: 10_001 })).toMatchObject({
      ...input,
      iss: 'fastgpt-plugin-invoke',
      iat: 10_000,
      exp: 40_000,
      methods: ['userInfo', 'uploadFile', 'wecomCorpToken']
    });
  });

  it('rejects tampered, expired, malformed, and method-escalated tokens', () => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    const token = service.issue(input, 10_000);

    expect(() => service.verify(`${token}x`, { method: 'userInfo', now: 10_001 })).toThrow();
    expect(() => service.verify(token, { method: 'userInfo', now: 40_000 })).toThrow(/Expired/);
    expect(() => service.verify(token, { method: 'deleteTenant', now: 10_001 })).toThrow(/capability denied/);
    expect(() => service.verify('not-a-token', { method: 'userInfo', now: 10_001 })).toThrow();
  });

  it('keeps upstream credentials opaque, randomizes tokens and rejects other keys', () => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    const token = service.issue(input);
    expect(token).not.toContain(input.invokeToken);
    expect(token.split('.').map((part) => Buffer.from(part, 'base64url').toString()).join('')).not.toContain(input.invokeToken);
    expect(service.issue(input)).not.toBe(token);
    const other = new InternalPluginInvokeTokenService('another-long-test-secret-with-at-least-32-characters');
    expect(() => other.verify(token, { method: 'userInfo' })).toThrow();
    expect(() => new InternalPluginInvokeTokenService('short')).toThrow(/secret/);
  });

  it.each(['tenantId', 'pluginId', 'invocationId'] as const)('rejects mismatched %s', (key) => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    expect(() => service.verify(service.issue(input), { method: 'userInfo', [key]: 'different' })).toThrow(/scope mismatch/);
  });

  it.each([0, -1, 1.5, 30_001, NaN])('rejects TTL %s', (ttl) => {
    expect(() => new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters', ttl)).toThrow(/TTL/);
  });

  it('ignores extra properties and rejects missing fields at the runtime boundary', () => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    expect(() => service.issue({ tenantId: 'system' } as never)).toThrow(/pluginId/);
    const token = service.issue({ ...input, exp: Number.MAX_SAFE_INTEGER } as typeof input);
    const claims = service.verify(token, { method: 'userInfo' });
    expect(claims.exp - claims.iat).toBe(30_000);
  });

  it('rejects claims without required identity and invocation context', () => {
    const service = new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters');
    expect(() => service.issue({ ...input, tenantId: '' })).toThrow(/tenantId/);
    expect(() => new InternalPluginInvokeTokenService('a-long-test-secret-with-at-least-32-characters', 30_001)).toThrow(/TTL/);
  });
});
