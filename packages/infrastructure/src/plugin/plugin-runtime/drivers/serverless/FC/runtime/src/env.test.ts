import { describe, expect, it } from 'vitest';

import { loadFCRuntimeEnv } from './env';

describe('loadFCRuntimeEnv', () => {
  it('loads secrets from non-reserved environment variables', () => {
    const env = loadFCRuntimeEnv({
      NODE_ENV: 'test',
      PORT: '9000',
      PLUGIN_ID: 'getTime',
      PLUGIN_VERSION: '1.0.0',
      PLUGIN_ETAG: 'abc',
      PLUGIN_ARTIFACT_BUCKET: 'bucket',
      PLUGIN_ARTIFACT_KEY: 'plugin-runtime/getTime/1.0.0/abc/index.js',
      FASTGPT_ARTIFACT_REGION: 'cn-hangzhou',
      FASTGPT_ARTIFACT_ACCESS_KEY_ID: 'test-access-key-id',
      FASTGPT_ARTIFACT_ACCESS_KEY_SECRET: 'test-access-key-secret',
      FASTGPT_BASE_URL: 'https://fastgpt.example.com',
      FASTGPT_INVOKE_SIGNING_SECRET: 'test-signing-secret'
    });

    expect(env.FASTGPT_INVOKE_SIGNING_SECRET).toBe('test-signing-secret');
    expect(env.FASTGPT_ARTIFACT_REGION).toBe('cn-hangzhou');
    expect(env.FASTGPT_ARTIFACT_ACCESS_KEY_ID).toBe('test-access-key-id');
    expect(env.FASTGPT_ARTIFACT_ACCESS_KEY_SECRET).toBe('test-access-key-secret');
  });
});
