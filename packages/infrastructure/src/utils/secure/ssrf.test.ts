import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env;

const importSsrf = async () => {
  vi.resetModules();
  return import('./ssrf');
};

describe('SSRF URL safety', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ALLOWED_INSTALL_HOSTS;
    delete process.env.DISABLE_SSRF_CHECK;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('blocks localhost and private IPv4 ranges by default', async () => {
    const { isInternalAddress, validateExternalFetchUrl } = await importSsrf();

    expect(isInternalAddress('http://127.0.0.1:3000/openapi.json')).toBe(true);
    expect(isInternalAddress('http://10.0.0.5/internal')).toBe(true);
    await expect(validateExternalFetchUrl('https://127.0.0.1/plugin.pkg')).resolves.toEqual({
      ok: false,
      error: 'internal-address'
    });
  });

  it('does not invert public IPv4 detection', async () => {
    const { isInternalAddress, validateExternalFetchUrl } = await importSsrf();

    expect(isInternalAddress('https://8.8.8.8/plugin.pkg')).toBe(false);
    await expect(validateExternalFetchUrl('https://8.8.8.8/plugin.pkg')).resolves.toEqual({
      ok: true,
      url: 'https://8.8.8.8/plugin.pkg'
    });
  });

  it('requires HTTPS when SSRF protection is enabled', async () => {
    const { validateExternalFetchUrl } = await importSsrf();

    await expect(validateExternalFetchUrl('http://8.8.8.8/plugin.pkg')).resolves.toEqual({
      ok: false,
      error: 'unsupported-protocol'
    });
  });

  it('enforces ALLOWED_INSTALL_HOSTS when configured', async () => {
    process.env.ALLOWED_INSTALL_HOSTS = '8.8.8.8';
    const { validateExternalFetchUrl } = await importSsrf();

    await expect(validateExternalFetchUrl('https://1.1.1.1/plugin.pkg')).resolves.toEqual({
      ok: false,
      error: 'host-not-allowed'
    });
  });
});
