import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  configureCliProxy,
  hasProxyEnv,
  resetCliProxyConfiguredForTest
} from './proxy';

describe('cli proxy', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetCliProxyConfiguredForTest();
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
  });

  afterEach(() => {
    resetCliProxyConfiguredForTest();
    process.env = { ...originalEnv };
  });

  it('detects proxy environment variables correctly', () => {
    expect(hasProxyEnv()).toBe(false);

    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    expect(hasProxyEnv()).toBe(true);

    delete process.env.HTTP_PROXY;
    process.env.https_proxy = 'https://127.0.0.1:8443';
    expect(hasProxyEnv()).toBe(true);
  });

  it('skips configuring proxy when no proxy env is defined', () => {
    const configured = configureCliProxy();
    expect(configured).toBe(false);
  });

  it('configures undici global dispatcher when proxy env is present', () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    const configured = configureCliProxy();
    expect(configured).toBe(true);
    expect(configureCliProxy()).toBe(true);
  });
});
