import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DataForB2B Search Companies', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('builds filters from slots and maps the response', async () => {
    const post = vi.fn().mockResolvedValue({
      data: { total: 5, count: 2, results: [{ name: 'Acme' }, { name: 'Globex' }] }
    });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    const out = await tool({
      apiKey: 'test-key',
      match: 'and',
      filter_1_column: 'industry',
      filter_1_operator: 'like',
      filter_1_value: 'software',
      count: 25,
      offset: 0,
      enrich_live: false
    } as any);

    expect(post).toHaveBeenCalledWith(
      '/search/companies',
      expect.objectContaining({ count: 25, offset: 0, enrich_live: false })
    );
    expect(out.total).toBe(5);
    expect(out.results).toHaveLength(2);
  });

  it('rejects when no filter slot or advanced filter is provided', async () => {
    await expect(
      tool({ apiKey: 'test-key', match: 'and', count: 25, offset: 0, enrich_live: false } as any)
    ).rejects.toBeTruthy();
  });
});
