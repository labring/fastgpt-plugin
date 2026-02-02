import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('GET Tool', () => {
  const testRedisUrl = 'redis://localhost:6379';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should get an existing value', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue('test value'),
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'test:get:key'
    });

    expect(result.value).toBe('test value');
    expect(result.exists).toBe(true);
    expect(mockClient.get).toHaveBeenCalledWith('test:get:key');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should return null for non-existent key', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue(null),
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'non:existent:key'
    });

    expect(result.value).toBe(null);
    expect(result.exists).toBe(false);
    expect(mockClient.get).toHaveBeenCalledWith('non:existent:key');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const connectionError = new Error('Redis connection refused');

    vi.spyOn(clientModule, 'createRedisClient').mockRejectedValue(connectionError);
    vi.spyOn(clientModule, 'handleRedisError').mockReturnValue('Redis connection refused');

    await expect(
      tool({
        redisUrl: 'redis://invalid-host:6379',
        key: 'test:key'
      })
    ).rejects.toBe('Redis connection refused');
  });
});
