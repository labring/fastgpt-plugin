import { describe, expect, it } from 'vitest';

import {
  LocalPoolGlobalServiceConfigSchema,
  LocalPoolPluginConfigSchema,
  LocalPoolServiceConfigSchema
} from './types';

const pluginConfig = {
  minPods: 1,
  maxPods: 2,
  podTimeout: 120000,
  maxConcurrentRequestsPerPod: 10
};

describe('local-pool config schemas', () => {
  it('keeps plugin config limited to plugin-scoped fields', () => {
    const parsed = LocalPoolPluginConfigSchema.parse({
      ...pluginConfig,
      idleTimeout: 60000,
      maxRequestsPerPod: 100,
      maxQueueSize: 500,
      queueTimeout: 60000,
      startupRetryBaseDelay: 1000,
      startupRetryMaxDelay: 10000
    });

    expect(parsed).toEqual(pluginConfig);
  });

  it('keeps global service config available for scheduler internals', () => {
    const parsed = LocalPoolServiceConfigSchema.parse({
      ...pluginConfig,
      idleTimeout: 60000,
      maxRequestsPerPod: 100,
      maxQueueSize: 500,
      queueTimeout: 60000,
      startupRetryBaseDelay: 1000,
      startupRetryMaxDelay: 10000
    });

    expect(parsed).toMatchObject({
      ...pluginConfig,
      idleTimeout: 60000,
      maxRequestsPerPod: 100,
      maxQueueSize: 500,
      queueTimeout: 60000,
      startupRetryBaseDelay: 1000,
      startupRetryMaxDelay: 10000
    });
  });

  it('rejects inverted startup retry delays', () => {
    expect(() =>
      LocalPoolGlobalServiceConfigSchema.parse({
        idleTimeout: 60000,
        maxRequestsPerPod: 100,
        maxQueueSize: 500,
        queueTimeout: 60000,
        startupRetryBaseDelay: 10000,
        startupRetryMaxDelay: 1000
      })
    ).toThrow();
  });
});
