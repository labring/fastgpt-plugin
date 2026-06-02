import { describe, expect, it, vi } from 'vitest';
import { tool } from '../src';

describe('Memmachine Store Tool', () => {
  it('should return memoryId on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [{ uid: '123' }] })
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        orgId: 'org-123',
        projectId: 'proj-123',
        types: ['episodic'],
        content: 'test content',
        producer: 'user-123',
        producedFor: 'agent-123',
        timestamp: '2024-01-01T00:00:00Z',
        role: 'user',
        metadata: '{"key":"value"}'
      } as any)
    ).resolves.toEqual({ memoryId: '123' });
  });

  it('should handle empty memory results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        content: 'test content'
      } as any)
    ).resolves.toEqual({ memoryId: '' });
  });

  it('should handle API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        content: 'test content'
      } as any)
    ).rejects.toEqual({ error: 'MemMachine API Error: 400 Bad Request' });
  });

  it('should handle invalid metadata JSON', async () => {
    await expect(
      tool({
        apiKey: 'test-api-key',
        content: 'test content',
        metadata: 'invalid-json'
      } as any)
    ).rejects.toMatchObject({ error: expect.stringMatching(/Invalid JSON format for metadata/) });
  });

  it('should handle invalid timestamp format', async () => {
    await expect(
      tool({
        apiKey: 'test-api-key',
        content: 'test content',
        timestamp: 'invalid-timestamp'
      } as any)
    ).rejects.toMatchObject({ error: expect.stringMatching(/Invalid format for timestamp/) });
  });
});
