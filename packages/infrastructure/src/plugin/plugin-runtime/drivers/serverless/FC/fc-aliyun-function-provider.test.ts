import { describe, expect, it, vi } from 'vitest';

import {
  invokeAliyunWithConnectRetry,
  resolveFCClientConstructor,
  toAliyunFunctionInput,
  toAliyunInvokeBody
} from './fc-aliyun-function-provider';
import type { FCFunctionDefinition } from './types';

describe('resolveFCClientConstructor', () => {
  it('uses a directly imported client constructor', () => {
    const Client = vi.fn();

    expect(resolveFCClientConstructor(Client)).toBe(Client);
  });

  it('unwraps the CommonJS default export exposed by native ESM', () => {
    const Client = vi.fn();

    expect(resolveFCClientConstructor({ default: Client })).toBe(Client);
  });

  it('rejects an unsupported SDK export shape', () => {
    expect(() => resolveFCClientConstructor({})).toThrow(
      'Invalid @alicloud/fc20230330 client export'
    );
  });
});

describe('toAliyunFunctionInput', () => {
  it('includes the required disk size for custom-container functions', () => {
    const definition: FCFunctionDefinition = {
      uniqueId: { pluginId: 'getTime', version: '1.0.0', etag: 'abc' },
      runtimeId: 'fc@getTime@1.0.0@abc',
      functionName: 'fastgpt-plugin-gettime',
      image: 'runtime:latest',
      roleArn: 'acs:ram::1234567890123456:role/fastgpt-plugin-fc-runtime',
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
      env: { PLUGIN_ID: 'getTime' }
    };

    expect(toAliyunFunctionInput(definition)).toMatchObject({
      runtime: 'custom-container',
      memorySize: 1024,
      diskSize: 512,
      environmentVariables: {
        PLUGIN_ID: 'getTime',
        FASTGPT_RUNTIME_ID: definition.runtimeId
      }
    });
  });
});

describe('toAliyunInvokeBody', () => {
  it('emits Buffer chunks accepted by the Darabonba SDK stream reader', async () => {
    const chunks: unknown[] = [];
    const body = toAliyunInvokeBody({
      runtimeId: 'fc@getTime@1.0.0@abc',
      functionName: 'fastgpt-plugin-gettime',
      invocationId: 'invocation-1',
      eventName: 'run',
      payload: { input: { timezone: 'Asia/Shanghai' } },
      returnStream: false,
      timeoutMs: 120000,
      invocationMode: 'openapi-buffered'
    });

    for await (const chunk of body) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(Buffer.isBuffer(chunks[0])).toBe(true);
    expect(JSON.parse((chunks[0] as Buffer).toString('utf8'))).toMatchObject({
      protocol: 'fastgpt-plugin-fc/v1',
      invocationId: 'invocation-1',
      payload: { input: { timezone: 'Asia/Shanghai' } }
    });
  });
});

describe('invokeAliyunWithConnectRetry', () => {
  it('retries once when the connection is not established before timeout', async () => {
    const connectTimeout = Object.assign(
      new Error('ConnectTimeout: Connect HTTPS://example.com failed.'),
      { name: 'RequestTimeoutError' }
    );
    const invoke = vi.fn().mockRejectedValueOnce(connectTimeout).mockResolvedValueOnce('ok');

    await expect(invokeAliyunWithConnectRetry(invoke)).resolves.toBe('ok');
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('does not retry errors that can occur after the request was sent', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('ReadTimeout(120000)'));

    await expect(invokeAliyunWithConnectRetry(invoke)).rejects.toThrow('ReadTimeout');
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});
