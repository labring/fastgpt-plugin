import { describe, expect, it } from 'vitest';

import { loadFCRuntimeEnv } from './env';

describe('loadFCRuntimeEnv', () => {
  it('loads the signing secret from a non-reserved environment variable', () => {
    const env = loadFCRuntimeEnv({
      NODE_ENV: 'test',
      PORT: '9000',
      PLUGIN_ID: 'getTime',
      PLUGIN_VERSION: '1.0.0',
      PLUGIN_ETAG: 'abc',
      PLUGIN_ARTIFACT_BUCKET: 'bucket',
      PLUGIN_ARTIFACT_KEY: 'plugin-runtime/getTime/1.0.0/abc/index.js',
      FASTGPT_BASE_URL: 'https://fastgpt.example.com',
      FASTGPT_INVOKE_SIGNING_SECRET: 'test-signing-secret'
    });

    expect(env.FASTGPT_INVOKE_SIGNING_SECRET).toBe('test-signing-secret');
  });
});
