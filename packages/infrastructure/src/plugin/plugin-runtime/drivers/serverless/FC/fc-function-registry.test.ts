import { describe, expect, it } from 'vitest';

import { InMemoryFCFunctionProvider } from './fc-function-provider';
import { FCFunctionRegistry } from './fc-function-registry';
import type { FCFunctionDefinition } from './types';

describe('FCFunctionRegistry', () => {
  it('creates then no-ops unchanged function definitions', async () => {
    const registry = new FCFunctionRegistry(new InMemoryFCFunctionProvider());
    const definition = createDefinition();

    await expect(registry.ensureFunction(definition)).resolves.toMatchObject({ state: 'created' });
    await expect(registry.ensureFunction(definition)).resolves.toMatchObject({
      state: 'unchanged'
    });
  });

  it('updates when function config drifts', async () => {
    const registry = new FCFunctionRegistry(new InMemoryFCFunctionProvider());
    const definition = createDefinition();

    await registry.ensureFunction(definition);

    await expect(
      registry.ensureFunction({
        ...definition,
        config: {
          ...definition.config,
          memorySize: 2048
        }
      })
    ).resolves.toMatchObject({ state: 'updated' });
  });
});

function createDefinition(): FCFunctionDefinition {
  return {
    uniqueId: { pluginId: 'getTime', version: '1.0.0', etag: 'abc' },
    runtimeId: 'fc@getTime@1.0.0@abc',
    functionName: 'fastgpt-plugin-gettime',
    image: 'runtime:latest',
    roleArn: 'role',
    artifact: { bucket: 'bucket', key: 'key' },
    config: {
      minInstances: 0,
      maxConcurrency: 10,
      timeoutMs: 120000,
      memorySize: 1024,
      diskSize: 512,
      cpu: 1,
      maxQueueSize: 500,
      queueTimeoutMs: 60000,
      invocationMode: 'http-stream'
    },
    env: {
      PLUGIN_ID: 'getTime'
    }
  };
}
