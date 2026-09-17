import { describe, expect, it } from 'vitest';

import moderation from './index';

const provider = moderation.getProvider();

const context = (secrets: Record<string, unknown>) => ({
  secrets,
  systemVar: {
    app: { id: 'test-app', name: 'Test App' },
    chat: { chatId: 'test-chat', uid: 'tester' },
    invokeToken: 'test-token',
    time: new Date().toISOString()
  },
  invoke: {} as never,
  moderationError: (message: string) => ({
    verdict: 'error' as const,
    hits: [],
    errorMessage: message
  })
});

const check = (content: string, secrets: Record<string, unknown>) =>
  provider.check({ content, modality: 'text' }, context(secrets));

describe('moderation template', () => {
  it('blocks content that matches a blocked keyword', async () => {
    const result = await check('this is blocked-content', { blockedKeywords: 'blocked-content' });

    expect(result.verdict).toBe('block');
    expect(result.hits).toEqual([
      { label: 'other', providerLabel: 'keyword', verdict: 'block', keywords: ['blocked-content'] }
    ]);
  });

  it('marks content as suspected for suspicious keywords', async () => {
    const result = await check('this is suspicious-content', {
      suspiciousKeywords: 'suspicious-content'
    });

    expect(result.verdict).toBe('suspected');
    expect(result.hits[0]?.verdict).toBe('suspected');
  });

  it('passes content without any keyword match', async () => {
    const result = await check('hello world', { blockedKeywords: 'blocked-content' });

    expect(result.verdict).toBe('pass');
    expect(result.hits).toEqual([]);
  });

  it('declares a valid moderation manifest', () => {
    const manifest = moderation.getUserModerationManifest();

    expect(manifest.pluginId).toBeTruthy();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(moderation.getPluginType()).toBe('moderation');
    expect(manifest.meta.modalities).toContain('text');
  });
});
