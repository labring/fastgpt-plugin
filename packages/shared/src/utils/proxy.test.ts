import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  configureGlobalProxy,
  getProxyEnv,
  hasProxyEnv,
  resetGlobalProxyForTest
} from './proxy';

describe('shared proxy utility', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetGlobalProxyForTest();
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
  });

  afterEach(() => {
    resetGlobalProxyForTest();
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

  it('collects proxy variables in getProxyEnv with dual case mapping', () => {
    expect(getProxyEnv()).toEqual({});

    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    process.env.no_proxy = 'localhost';

    expect(getProxyEnv()).toEqual({
      HTTP_PROXY: 'http://127.0.0.1:8080',
      http_proxy: 'http://127.0.0.1:8080',
      NO_PROXY: 'localhost',
      no_proxy: 'localhost'
    });
  });

  it('skips configuring proxy when no proxy env is defined', () => {
    const configured = configureGlobalProxy();
    expect(configured).toBe(false);
  });

  it('configures undici global dispatcher when proxy env is present', () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
    const configured = configureGlobalProxy();
    expect(configured).toBe(true);
    expect(configureGlobalProxy()).toBe(true);
  });
});
