import { afterEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

import { ModerationCheckResultSchema } from '@domain/value-objects/moderation.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';

import {
  createLocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from '../../../apps/cli/src/debug/runtime';

import {
  defineModeration,
  defineModerationManifest,
  type ModerationProvider,
  type ModerationProviderContext
} from './index';

const SYSTEM_VAR = {
  app: { id: 'test-app', name: 'Test App' },
  chat: { chatId: 'test-chat', uid: 'tester' },
  invokeToken: 'test-token',
  time: new Date().toISOString()
} as never;

describe('ModerationFactory', () => {
  const previousRuntimeMode = process.env.RUNTIME_MODE;

  afterEach(() => {
    setCurrentLocalDebugRuntime(undefined);
    if (previousRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = previousRuntimeMode;
    }
  });

  /** 起一次进程内调试运行时，把 check 事件跑完并收集输出帧 */
  async function runCheck({
    provider,
    secretSchema,
    payload,
    secrets
  }: {
    provider: ModerationProvider;
    secretSchema?: z.ZodObject<any>;
    payload: Record<string, unknown>;
    secrets?: Record<string, unknown>;
  }): Promise<PluginStreamMessageType[]> {
    const runtime = createLocalDebugRuntime();
    setCurrentLocalDebugRuntime(runtime);
    process.env.RUNTIME_MODE = 'dev';

    defineModeration({
      manifest: defineModerationManifest({
        pluginId: 'moderation-test',
        version: '1.0.0',
        name: { en: 'Moderation Test', 'zh-CN': '审查测试' },
        description: { en: 'Moderation Test', 'zh-CN': '审查测试' },
        meta: { provider: provider.name, modalities: provider.modalities }
      }),
      ...(secretSchema ? { secretSchema } : {}),
      provider
    });

    await runtime.waitUntilReady();

    const response = await runtime.invokePlugin<
      Record<string, unknown>,
      void,
      never,
      PluginStreamMessageType
    >(
      'check',
      {
        input: payload,
        systemVar: SYSTEM_VAR,
        ...(secrets ? { secrets } : {})
      },
      { traceId: 'test-trace' }
    );

    const messages: PluginStreamMessageType[] = [];
    await response.output?.stream.consume((chunk) => {
      messages.push(chunk as PluginStreamMessageType);
    });

    return messages;
  }

  const blockProvider = (): ModerationProvider => ({
    name: 'keyword',
    modalities: ['text'],
    check: async () => ({
      verdict: 'block',
      hits: [{ label: 'other', providerLabel: 'keyword', keywords: ['bad word'] }]
    })
  });

  it('fills provider and derived keywords before validating the standard structure', async () => {
    const messages = await runCheck({
      provider: blockProvider(),
      payload: { content: 'bad word', modality: 'text' }
    });

    expect(messages).toHaveLength(1);
    const message = messages[0];
    expect(message?.type).toBe('response');

    const parsed = ModerationCheckResultSchema.parse(message?.data);
    expect(parsed).toEqual({
      status: 'done',
      result: {
        verdict: 'block',
        keywords: ['bad word'],
        hits: [{ label: 'other', providerLabel: 'keyword', keywords: ['bad word'] }],
        provider: 'keyword'
      }
    });
  });

  it('reports a framework-level error when the provider result does not match the contract', async () => {
    const messages = await runCheck({
      provider: {
        name: 'keyword',
        modalities: ['text'],
        check: async () => ({ hits: [] }) as never
      },
      payload: { content: 'x', modality: 'text' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(String(messages[0]?.data)).toContain('verdict');
  });

  it('treats an uncaught provider exception as a framework failure, not an error verdict', async () => {
    const provider: ModerationProvider = {
      name: 'keyword',
      modalities: ['text'],
      check: async () => {
        throw new Error('boom');
      }
    };

    const messages = await runCheck({ provider, payload: { content: 'x', modality: 'text' } });

    expect(messages[0]).toEqual({ type: 'error', data: 'boom' });
  });

  it('validates secrets only when secretSchema is declared and never strips undeclared ones', async () => {
    const captured: Record<string, unknown>[] = [];
    const provider: ModerationProvider = {
      name: 'keyword',
      modalities: ['text'],
      check: async (_input, ctx) => {
        captured.push(ctx.secrets);
        return { verdict: 'pass', hits: [] };
      }
    };

    const mismatched = await runCheck({
      provider,
      secretSchema: z.object({ apiKey: z.string() }),
      payload: { content: 'x', modality: 'text' },
      secrets: { apiKey: 123 }
    });
    expect(mismatched[0]?.type).toBe('error');
    expect(captured).toHaveLength(0);

    await runCheck({
      provider,
      secretSchema: z.object({ apiKey: z.string() }),
      payload: { content: 'x', modality: 'text' },
      secrets: { apiKey: 'x', extra: 'y' }
    });
    expect(captured[0]).toEqual({ apiKey: 'x' });

    await runCheck({
      provider,
      payload: { content: 'x', modality: 'text' },
      secrets: { anything: 1 }
    });
    expect(captured[1]).toEqual({ anything: 1 });
  });

  it('rejects non-text modalities before calling the adapter', async () => {
    const check = vi.fn(async () => ({ verdict: 'pass' as const, hits: [] }));
    const provider: ModerationProvider = { name: 'keyword', modalities: ['text'], check };

    const messages = await runCheck({
      provider,
      payload: { content: 'x', modality: 'audio' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(check).not.toHaveBeenCalled();
  });

  it('rejects modalities the provider does not implement', async () => {
    const check = vi.fn(async () => ({ verdict: 'pass' as const, hits: [] }));
    const provider: ModerationProvider = { name: 'keyword', modalities: ['image'], check };

    const messages = await runCheck({
      provider,
      payload: { content: 'x', modality: 'text' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(check).not.toHaveBeenCalled();
  });

  it('rejects a provider that declares no modality', () => {
    expect(() =>
      defineModeration({
        manifest: defineModerationManifest({
          pluginId: 'moderation-test',
          version: '1.0.0',
          name: { en: 'Moderation Test', 'zh-CN': '审查测试' },
          description: { en: 'Moderation Test', 'zh-CN': '审查测试' },
          meta: { provider: 'keyword', modalities: ['text'] }
        }),
        provider: { name: 'keyword', modalities: [], check: async () => ({ verdict: 'pass', hits: [] }) }
      })
    ).toThrow(/at least one modality/);
  });

  it('turns moderationError into a valid error verdict result', async () => {
    const provider: ModerationProvider = {
      name: 'keyword',
      modalities: ['text'],
      check: async (_input, ctx: ModerationProviderContext<Record<string, unknown>>) =>
        ctx.moderationError('upstream timeout')
    };

    const messages = await runCheck({ provider, payload: { content: 'x', modality: 'text' } });

    const parsed = ModerationCheckResultSchema.parse(messages[0]?.data);
    expect(parsed.result.verdict).toBe('error');
    expect(parsed.result.errorMessage).toBe('upstream timeout');
    expect(parsed.result.hits).toEqual([]);
  });
});
