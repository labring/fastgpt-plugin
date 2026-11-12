import { describe, expect, it, type Mock, vi } from 'vitest';

import { createError } from '@domain/value-objects/error.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { makeModerationRoute } from './moderation.route';

const SYSTEM_VAR = {
  app: { id: 'app', name: 'app' },
  chat: { chatId: 'chat' },
  invokeToken: 'token',
  time: '2026-01-01T00:00:00Z'
};

const checkBody = (overrides: Record<string, unknown> = {}) => ({
  pluginId: 'moderation-a',
  input: { content: 'hello' },
  systemVar: SYSTEM_VAR,
  ...overrides
});

const MODERATION_RESULT = {
  verdict: 'block',
  keywords: ['bad'],
  hits: [{ label: 'other', providerLabel: 'keyword', keywords: ['bad'] }],
  provider: 'keyword'
};

function createManager(overrides: Record<string, unknown> = {}) {
  return {
    check: vi.fn(),
    detail: vi.fn(),
    ...overrides
  } as never;
}

function createRoute(check: Mock, detail: Mock = vi.fn()) {
  return makeModerationRoute({
    moderationManager: createManager({ check, detail }),
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  });
}

describe('moderation route', () => {
  it('returns the check result on success', async () => {
    const app = createRoute(vi.fn().mockResolvedValue(successResult(MODERATION_RESULT)));

    const response = await app.request('/moderation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody())
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: MODERATION_RESULT });
  });

  it('returns 400 with the error body when the manager fails', async () => {
    const app = createRoute(
      vi.fn().mockResolvedValue(failureResult(createError(ErrorCode.pluginInvokeFailed)))
    );

    const response = await app.request('/moderation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody())
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: ErrorCode.pluginInvokeFailed }
    });
  });

  it('rejects non-text modality fields instead of silently treating them as text', async () => {
    const check = vi.fn().mockResolvedValue(successResult(MODERATION_RESULT));
    const app = createRoute(check);

    const response = await app.request('/moderation/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody({ input: { content: 'x', modality: 'image' } }))
    });

    expect(response.status).toBe(400);
    expect(check).not.toHaveBeenCalled();
  });

  it('returns the plugin detail on success', async () => {
    const detail = vi.fn().mockResolvedValue(
      successResult({
        pluginId: 'moderation-a',
        version: '1.0.0',
        etag: 'etag-a',
        type: 'moderation',
        name: { en: 'Moderation A', 'zh-CN': '审查 A' },
        icon: '',
        description: { en: 'Moderation A', 'zh-CN': '审查 A' },
        meta: { provider: 'keyword' },
        source: 'system',
        isLatestVersion: true
      })
    );
    const app = createRoute(vi.fn(), detail);

    const response = await app.request('/moderation?pluginId=moderation-a&source=system');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { pluginId: 'moderation-a', isLatestVersion: true }
    });
  });

  it('returns 404 when the plugin detail lookup fails', async () => {
    const detail = vi
      .fn()
      .mockResolvedValue(failureResult(createError(ErrorCode.pluginRuntimePluginNotFound)));
    const app = createRoute(vi.fn(), detail);

    const response = await app.request('/moderation?pluginId=missing');

    expect(response.status).toBe(404);
  });
});
