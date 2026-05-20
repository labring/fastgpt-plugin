import { describe, expect, it } from 'vitest';

import { PluginRuntimeConfigSchema } from './plugin.dto';

describe('PluginRuntimeConfigSchema', () => {
  it('rejects global local-pool fields from plugin runtime config API', () => {
    expect(() =>
      PluginRuntimeConfigSchema.parse({
        minPods: 1,
        maxPods: 2,
        podTimeout: 120000,
        maxConcurrentRequestsPerPod: 10,
        idleTimeout: 60000
      })
    ).toThrow();
  });
});
