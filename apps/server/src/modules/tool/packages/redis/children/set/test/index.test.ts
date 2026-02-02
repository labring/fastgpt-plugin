import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('SET Tool', () => {
  const testRedisUrl = 'redis://localhost:6379';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should set a value without TTL', async () => {
    const mockClient = {
      set: vi.fn().mockResolvedValue('OK'),
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'test:set:key',
      value: 'test value',
      ttl: 0
    });

    expect(result.success).toBe(true);
    expect(mockClient.set).toHaveBeenCalledWith('test:set:key', 'test value');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should set a value with TTL', async () => {
    const mockClient = {
      setex: vi.fn().mockResolvedValue('OK'),
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'test:set:key',
      value: 'test value with ttl',
      ttl: 60
    });

    expect(result.success).toBe(true);
    expect(mockClient.setex).toHaveBeenCalledWith('test:set:key', 60, 'test value with ttl');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const connectionError = new Error('Redis connection refused');

    vi.spyOn(clientModule, 'createRedisClient').mockRejectedValue(connectionError);
    vi.spyOn(clientModule, 'handleRedisError').mockReturnValue('Redis connection refused');

    await expect(
      tool({
        redisUrl: 'redis://invalid-host:6379',
        key: 'test:key',
        value: 'test value',
        ttl: 0
      })
    ).rejects.toBe('Redis connection refused');
  });
});
