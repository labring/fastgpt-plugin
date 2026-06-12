import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env;

const resetEnv = () => {
  process.env = { ...originalEnv };
  delete process.env.AUTH_TOKEN;
  delete process.env.CONNECTION_GATEWAY_AUTH_TOKEN;
  delete process.env.NODE_ENV;
  delete process.env.DISABLE_SSRF_CHECK;
  delete process.env.METRICS_ENABLE_OTEL;
  delete process.env.METRICS_OTEL_URL;
  delete process.env.METRICS_EXPORT_INTERVAL_MS;
  delete process.env.METRICS_EXPORT_TIMEOUT_MS;
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

    const { env } = await import('./index');

    expect(() => env.AUTH_TOKEN).toThrow('AUTH_TOKEN');
  });

  it('rejects default AUTH_TOKEN values in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'token';

    const { env } = await import('./index');

    expect(() => env.AUTH_TOKEN).toThrow('AUTH_TOKEN');
  });

  it('rejects short AUTH_TOKEN values in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'short-token';

    const { env } = await import('./index');

    expect(() => env.AUTH_TOKEN).toThrow('AUTH_TOKEN');
  });

  it('accepts a strong AUTH_TOKEN in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'a'.repeat(32);
    process.env.CONNECTION_GATEWAY_AUTH_TOKEN = 'b'.repeat(32);

    const { env } = await import('./index');

    expect(env.AUTH_TOKEN).toBe('a'.repeat(32));
  });

  it('allows server auth token and gateway auth token to differ', async () => {
    process.env.AUTH_TOKEN = 'server-token';
    process.env.CONNECTION_GATEWAY_AUTH_TOKEN = 'gateway-token';

    const { serverEnv } = await import('./index');

    expect(serverEnv.AUTH_TOKEN).toBe('server-token');
    expect(serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN).toBe('gateway-token');
  });

  it('falls back to AUTH_TOKEN for gateway auth token in local development', async () => {
    process.env.AUTH_TOKEN = 'server-and-gateway-token';

    const { serverEnv } = await import('./index');

    expect(serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN).toBe('server-and-gateway-token');
  });

  it('requires an explicit gateway auth token in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'a'.repeat(32);

    const { serverEnv } = await import('./index');

    expect(() => serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN).toThrow('CONNECTION_GATEWAY_AUTH_TOKEN');
  });

  it('accepts different strong server and gateway auth tokens in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 's'.repeat(32);
    process.env.CONNECTION_GATEWAY_AUTH_TOKEN = 'g'.repeat(32);

    const { serverEnv } = await import('./index');

    expect(serverEnv.AUTH_TOKEN).toBe('s'.repeat(32));
    expect(serverEnv.CONNECTION_GATEWAY_AUTH_TOKEN).toBe('g'.repeat(32));
  });

  it('keeps metrics disabled by default', async () => {
    const { env } = await import('./index');

    expect(env.METRICS_ENABLE_OTEL).toBe(false);
    expect(env.METRICS_OTEL_URL).toBe('http://localhost:4318/v1/metrics');
    expect(env.METRICS_EXPORT_INTERVAL_MS).toBe(30_000);
    expect(env.METRICS_EXPORT_TIMEOUT_MS).toBe(10_000);
  });

  it('rejects invalid metrics OTLP URLs', async () => {
    process.env.METRICS_OTEL_URL = 'not-a-url';

    const { env } = await import('./index');

    expect(() => env.METRICS_OTEL_URL).toThrow('METRICS_OTEL_URL');
  });

  it('rejects non-positive metrics export timings', async () => {
    process.env.METRICS_EXPORT_INTERVAL_MS = '0';

    const { env } = await import('./index');

    expect(() => env.METRICS_EXPORT_INTERVAL_MS).toThrow('METRICS_EXPORT_INTERVAL_MS');
  });

  it('does not require server gateway client token when only gateway env is read', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'g'.repeat(32);

    const { gatewayEnv } = await import('./index');

    expect(gatewayEnv.AUTH_TOKEN).toBe('g'.repeat(32));
  });

  it('does not require server gateway client token when gateway imports auth middleware factory', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'g'.repeat(32);

    await expect(import('../hono/middleware/auth')).resolves.toHaveProperty(
      'createBearerHonoAuthMiddleware'
    );
  });

  it('does not require server gateway client token when gateway imports shared Redis client', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN = 'g'.repeat(32);

    await expect(import('../redis/redis-client')).resolves.toHaveProperty('RedisClient');
  });
});
