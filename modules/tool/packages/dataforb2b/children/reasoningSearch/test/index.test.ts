import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DataForB2B Reasoning Search', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends a natural-language query and maps results', async () => {
    const post = vi.fn().mockResolvedValue({
      data: { status: 'ok', total: 3, results: [{ first_name: 'Jane' }] }
    });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    const out = await tool({
      apiKey: 'test-key',
      query: 'Heads of Growth at Series B SaaS in Germany',
      category: 'people',
      max_results: 25,
      enrich_live: false
    } as any);

    expect(post).toHaveBeenCalledWith(
      '/search/reasoning',
      expect.objectContaining({ query: expect.any(String), category: 'people' })
    );
    expect(out.total).toBe(3);
    expect(out.results).toHaveLength(1);
  });

  it('surfaces a needs_input turn with questions and session_id', async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        status: 'needs_input',
        session_id: 'sess_1',
        questions: [{ id: 'q1', text: 'Which country?' }]
      }
    });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    const out = await tool({
      apiKey: 'test-key',
      query: 'growth leaders',
      category: 'people',
      max_results: 25,
      enrich_live: false
    } as any);

    expect(out.status).toBe('needs_input');
    expect(out.session_id).toBe('sess_1');
    expect(out.questions).toHaveLength(1);
  });

  it('rejects when neither query nor session_id+answers is provided', async () => {
    await expect(
      tool({ apiKey: 'test-key', category: 'people', max_results: 25, enrich_live: false } as any)
    ).rejects.toBeTruthy();
  });
});
