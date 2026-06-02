import { describe, expect, it, vi } from 'vitest';
import { tool } from '../src';
import { contextTemplate } from '../src/contextTemplate';

const mockSearchResult = {
  content: {
    episodic_memory: {
      long_term_memory: {
        episodes: [
          {
            content: 'In 2020, the user showed interest in machine learning.',
            producer_id: 'user-123',
            producer_role: 'user',
            produced_for_id: 'agent-456',
            episode_type: 'message',
            metadata: null,
            created_at: '2024-01-15T10:00:00Z',
            uid: '1'
          }
        ]
      },
      short_term_memory: {
        episodes: [
          {
            content: 'User asked about AI advancements.',
            producer_id: 'user-123',
            producer_role: 'user',
            produced_for_id: 'agent-456',
            episode_type: 'message',
            metadata: null,
            created_at: '2024-06-01T12:00:00Z',
            uid: '3'
          }
        ],
        episode_summary: ['User is interested in AI.']
      }
    },
    semantic_memory: [
      {
        set_id: 'mem_session_universal/universal',
        category: 'profile',
        tag: 'Interest',
        feature_name: 'Topic',
        value: 'Artificial Intelligence',
        metadata: {
          citations: null,
          id: 2,
          other: null
        }
      }
    ]
  }
};

describe('Memmachine Search Tool', () => {
  it('should return search results on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSearchResult
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        query: 'Tell me about AI',
        contextTemplate: contextTemplate
      } as any)
    ).resolves.toMatchObject({
      memoryContext: expect.stringContaining('User is interested in AI.')
    });
  });

  it('should handle empty search results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        query: 'Tell me about AI',
        contextTemplate: ''
      } as any)
    ).resolves.toMatchObject({
      memoryContext: ''
    });
  });

  it('should handle empty memory sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: {
            episodic_memory: {
              long_term_memory: { episodes: [] },
              short_term_memory: { episodes: [{}], episode_summary: [] }
            },
            semantic_memory: [{}]
          }
        })
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        query: 'Tell me about AI',
        contextTemplate: contextTemplate
      } as any)
    ).resolves.toMatchObject({
      memoryContext: expect.stringContaining('Unknown')
    });
  });

  it('should handle API error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })
    );
    await expect(
      tool({
        apiKey: 'test-api-key',
        query: 'Tell me about AI',
        contextTemplate: contextTemplate
      } as any)
    ).rejects.toMatchObject({
      error: 'MemMachine API Error: 403 Forbidden'
    });
  });
});
