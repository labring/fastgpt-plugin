import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('DataForB2B Enrich Profile', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends the identifier and selected flags', async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { full_name: 'Jane Doe', work_email: 'jane@acme.com' } });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    const out = await tool({
      apiKey: 'test-key',
      profile_identifier: 'jane-doe',
      enrich_profile: true,
      enrich_work_email: true,
      enrich_personal_email: false,
      enrich_phone: false,
      enrich_github: false
    } as any);

    expect(post).toHaveBeenCalledWith(
      '/enrich/profile',
      expect.objectContaining({ profile_identifier: 'jane-doe', enrich_work_email: true })
    );
    expect(out.result).toMatchObject({ work_email: 'jane@acme.com' });
  });

  it('defaults to full profile when no flag is enabled', async () => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    vi.spyOn(clientModule, 'createDataForB2BClient').mockReturnValue({ post } as any);

    await tool({
      apiKey: 'test-key',
      profile_identifier: 'jane-doe',
      enrich_profile: false,
      enrich_work_email: false,
      enrich_personal_email: false,
      enrich_phone: false,
      enrich_github: false
    } as any);

    expect(post).toHaveBeenCalledWith(
      '/enrich/profile',
      expect.objectContaining({ enrich_profile: true })
    );
  });
});
