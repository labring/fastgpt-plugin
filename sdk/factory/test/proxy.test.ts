import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  configurePluginProxy,
  hasProxyEnv,
  resetPluginProxyConfiguredForTest
} from '../src/proxy';

describe('sdk-factory proxy', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPluginProxyConfiguredForTest();
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
  });

  afterEach(() => {
    resetPluginProxyConfiguredForTest();
    process.env = { ...originalEnv };
  });

  it('detects proxy environment variables correctly', () => {
    expect(hasProxyEnv()).toBe(false);

    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    expect(hasProxyEnv()).toBe(true);

    delete process.env.HTTP_PROXY;
    process.env.all_proxy = 'socks5://127.0.0.1:1080';
    expect(hasProxyEnv()).toBe(true);
  });

  it('skips configuring proxy when no proxy env is defined', () => {
    const configured = configurePluginProxy();
    expect(configured).toBe(false);
  });

  it('configures undici global dispatcher when proxy env is present', () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    const configured = configurePluginProxy();
    expect(configured).toBe(true);

    // Repeated calls should return true immediately
    expect(configurePluginProxy()).toBe(true);
  });
});
