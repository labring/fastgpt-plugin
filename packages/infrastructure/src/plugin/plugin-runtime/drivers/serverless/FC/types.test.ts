import { describe, expect, it } from 'vitest';

import { FCPluginConfigSchema } from './types';

describe('FCPluginConfigSchema', () => {
  it('keeps FC plugin config limited to plugin-scoped fields', () => {
    const parsed = FCPluginConfigSchema.parse({
      minInstances: 0,
      maxConcurrency: 10,
      timeoutMs: 120000,
      memorySize: 1024,
      diskSize: 512,
      cpu: 1,
      reservedConcurrency: 20,
      provisionedConcurrency: 1,
      maxQueueSize: 500,
      queueTimeoutMs: 60000,
      invocationMode: 'http-stream',
      unknown: 'ignored'
    });

    expect(parsed).toEqual({
      minInstances: 0,
      maxConcurrency: 10,
      timeoutMs: 120000,
      memorySize: 1024,
      diskSize: 512,
      cpu: 1,
      reservedConcurrency: 20,
      provisionedConcurrency: 1,
      maxQueueSize: 500,
      queueTimeoutMs: 60000,
      invocationMode: 'http-stream'
    });
  });

  it('defaults disk size for persisted configs created before disk support', () => {
    const parsed = FCPluginConfigSchema.parse({
      minInstances: 0,
      maxConcurrency: 10,
      timeoutMs: 120000,
      memorySize: 1024,
      cpu: 1,
      maxQueueSize: 500,
      queueTimeoutMs: 60000,
      invocationMode: 'http-stream'
    });

    expect(parsed.diskSize).toBe(512);
  });
});
