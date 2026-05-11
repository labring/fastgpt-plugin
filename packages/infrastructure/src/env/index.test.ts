import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env;

const resetEnv = () => {
  process.env = { ...originalEnv };
  delete process.env.AUTH_TOKEN;
  delete process.env.NODE_ENV;
  delete process.env.DISABLE_SSRF_CHECK;
};

describe('env AUTH_TOKEN', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps the development fallback token for local compatibility', async () => {
    const { env } = await import('./index');

    expect(env.AUTH_TOKEN).toBe('token');
  });

  it('requires AUTH_TOKEN in production', async () => {
    process.env.NODE_ENV = 'production';

    await expect(import('./index')).rejects.toThrow('AUTH_TOKEN');
  });

  it('rejects default AUTH_TOKEN values in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'token';

    await expect(import('./index')).rejects.toThrow('AUTH_TOKEN');
  });

  it('rejects short AUTH_TOKEN values in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'short-token';

    await expect(import('./index')).rejects.toThrow('AUTH_TOKEN');
  });

  it('accepts a strong AUTH_TOKEN in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'a'.repeat(32);

    const { env } = await import('./index');

    expect(env.AUTH_TOKEN).toBe('a'.repeat(32));
  });
});
