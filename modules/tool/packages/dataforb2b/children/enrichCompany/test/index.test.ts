import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DataForB2B Enrich Company', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends the company identifier and maps the response', async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { name: 'Google', industry: 'software development' } });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    const out = await tool({ apiKey: 'test-key', company_identifier: 'google' } as any);

    expect(post).toHaveBeenCalledWith('/enrich/company', { company_identifier: 'google' });
    expect(out.result).toMatchObject({ name: 'Google' });
  });
});
