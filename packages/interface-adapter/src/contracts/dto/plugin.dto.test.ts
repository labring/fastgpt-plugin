import { describe, expect, it } from 'vitest';

import { PluginListParamsSchema, PluginRuntimeConfigSchema } from './plugin.dto';

describe('PluginRuntimeConfigSchema', () => {
  it('rejects global local-pool fields from plugin runtime config API', () => {
    expect(() =>
      PluginRuntimeConfigSchema.parse({
        minPods: 1,
        maxPods: 2,
        podTimeout: 120000,
        maxConcurrentRequestsPerPod: 10,
        idleTimeout: 60000,
        startupRetryBaseDelay: 1000,
        startupRetryMaxDelay: 10000
      })
    ).toThrow();
  });
});

describe('PluginListParamsSchema', () => {
  it('falls back unknown tags to other and unknown types to unknown', () => {
    const parsed = PluginListParamsSchema.parse({
      types: 'custom_type',
      tags: ['new_tag', 'tools']
    });
    expect(parsed.types).toEqual(['unknown']);
    expect(parsed.tags).toEqual(['other', 'tools']);
  });
});
