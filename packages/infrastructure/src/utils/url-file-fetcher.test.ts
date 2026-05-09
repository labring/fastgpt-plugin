import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env;
const originalFetch = globalThis.fetch;

describe('URLFileFetcher', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.ALLOWED_INSTALL_HOSTS;
    delete process.env.DISABLE_SSRF_CHECK;
    delete process.env.NODE_ENV;
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('rejects redirects to internal addresses', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          location: 'https://127.0.0.1/plugin.pkg'
        }
      })
    );

    const { URLFileFetcher } = await import('./url-file-fetcher');
    const fetcher = new URLFileFetcher();

    const [, err] = await fetcher.getFileBuffer('https://8.8.8.8/plugin.pkg');

    expect(err?.reason.en).toBe('SSRF: Internal address is not allowed');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
