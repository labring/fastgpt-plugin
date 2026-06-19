import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DataForB2B Typeahead', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('resolves stored values for a type/query', async () => {
    const get = vi.fn().mockResolvedValue({
      data: { results: [{ value: 'Computer Software' }, { value: 'Software Development' }] }
    });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ get } as any);

    const out = await tool({
      apiKey: 'test-key',
      type: 'people_industry',
      q: 'soft',
      limit: 20
    } as any);

    expect(get).toHaveBeenCalledWith(
      '/typeahead',
      expect.objectContaining({ params: { type: 'people_industry', q: 'soft', limit: 20 } })
    );
    expect(out.values).toEqual(['Computer Software', 'Software Development']);
    expect(out.results).toHaveLength(2);
  });

  it('clamps the limit to the 1-20 range', async () => {
    const get = vi.fn().mockResolvedValue({ data: { results: [] } });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ get } as any);

    await tool({ apiKey: 'test-key', type: 'title', q: 'eng', limit: 999 } as any);

    expect(get).toHaveBeenCalledWith(
      '/typeahead',
      expect.objectContaining({ params: expect.objectContaining({ limit: 20 }) })
    );
  });
});
