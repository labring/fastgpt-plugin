import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DELETE Tool', () => {
  const testRedisUrl = 'redis://localhost:6379';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should delete an existing key', async () => {
    const mockClient = {
      del: vi.fn().mockResolvedValue(1), // 1 key deleted
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'test:del:key'
    });

    expect(result.deleted).toBe(true);
    expect(mockClient.del).toHaveBeenCalledWith('test:del:key');
    expect(mockClient.quit).toHaveBeenCalled();
  });

  it('should return false for non-existent key', async () => {
    const mockClient = {
      del: vi.fn().mockResolvedValue(0), // 0 keys deleted
      quit: vi.fn().mockResolvedValue('OK')
    };

    vi.spyOn(clientModule, 'createRedisClient').mockResolvedValue(mockClient as any);

    const result = await tool({
      redisUrl: testRedisUrl,
      key: 'non:existent:key'
    });

    expect(result.deleted).toBe(false);
    expect(mockClient.del).toHaveBeenCalledWith('non:existent:key');
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
