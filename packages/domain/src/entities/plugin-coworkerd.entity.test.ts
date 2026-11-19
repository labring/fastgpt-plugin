import { describe, expect, it } from 'vitest';

import { CoworkerdConfigSchema, CoworkerdPluginConfigSchema } from './plugin-coworkerd.entity';

describe('CoworkerdConfigSchema', () => {
  it('parses valid config with default values', () => {
    const raw = {
      apiServerUrl: 'http://apiserver.coworkerd.local:8940',
      ingressUrl: 'http://ingress.coworkerd.local:8930',
      managementToken: 'admin-secret-token'
    };

    const parsed = CoworkerdConfigSchema.parse(raw);
    expect(parsed.apiServerUrl).toBe('http://apiserver.coworkerd.local:8940');
    expect(parsed.ingressUrl).toBe('http://ingress.coworkerd.local:8930');
    expect(parsed.managementToken).toBe('admin-secret-token');
    expect(parsed.defaultLimits).toEqual({
      cpuMs: 200,
      memoryMiB: 128
    });
    expect(parsed.requestTimeoutMs).toBe(30_000);
  });

  it('allows overriding defaultLimits and optional internalInvokeGatewayUrl', () => {
    const raw = {
      apiServerUrl: 'http://apiserver.coworkerd.local:8940',
      ingressUrl: 'http://ingress.coworkerd.local:8930',
      managementToken: 'admin-secret-token',
      defaultLimits: {
        cpuMs: 500,
        memoryMiB: 256
      },
      internalInvokeGatewayUrl: 'http://fastgpt-host:3000/api/internal/plugin-invoke/v1',
      requestTimeoutMs: 15_000
    };

    const parsed = CoworkerdConfigSchema.parse(raw);
    expect(parsed.defaultLimits.cpuMs).toBe(500);
    expect(parsed.defaultLimits.memoryMiB).toBe(256);
    expect(parsed.internalInvokeGatewayUrl).toBe(
      'http://fastgpt-host:3000/api/internal/plugin-invoke/v1'
    );
    expect(parsed.requestTimeoutMs).toBe(15_000);
  });

  it('validates tenant identity and infrastructure-only plugin configuration', () => {
    expect(CoworkerdPluginConfigSchema.parse({ tenantId: 'project-1', limits: {} })).toEqual({ tenantId: 'project-1', limits: { cpuMs: 200, memoryMiB: 128 } });
    for (const tenantId of ['routes', 'generation', '../x', '', 'Tenant']) {
      expect(CoworkerdPluginConfigSchema.safeParse({ tenantId, limits: {} }).success).toBe(false);
    }
    expect(CoworkerdPluginConfigSchema.safeParse({ tenantId: 'system', limits: {}, invokeToken: 'secret' }).success).toBe(false);
  });

  it('rejects invalid URLs or empty tokens', () => {
    expect(() =>
      CoworkerdConfigSchema.parse({
        apiServerUrl: 'invalid-url',
        ingressUrl: 'http://ingress.coworkerd.local:8930',
        managementToken: 'token'
      })
    ).toThrow();

    expect(() =>
      CoworkerdConfigSchema.parse({
        apiServerUrl: 'http://apiserver.coworkerd.local:8940',
        ingressUrl: 'http://ingress.coworkerd.local:8930',
        managementToken: ''
      })
    ).toThrow();
  });
});
