import { afterEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

import { ModerationResultSchema } from '@domain/value-objects/moderation.vo';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';

import {
  createLocalDebugRuntime,
  setCurrentLocalDebugRuntime
} from '../../../apps/cli/src/debug/runtime';

import {
  defineModeration,
  defineModerationManifest,
  type ModerationProvider,
  type ModerationProviderContext,
  type ModerationProviderResultType
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

  /** Start an in-process debug runtime and collect the check response frames. */
  async function runCheck({
    provider,
    secretSchema,
    payload,
    secrets
  }: {
    provider: ModerationProvider<any>;
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
        meta: { provider: provider.name }
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
    check: async () => ({
      verdict: 'block',
      hits: [{ label: 'other', providerLabel: 'keyword', keywords: ['bad word'] }]
    })
  });

  it('fills provider and derived keywords before validating the result', async () => {
    const messages = await runCheck({
      provider: blockProvider(),
      payload: { content: 'bad word' }
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.type).toBe('response');
    expect(ModerationResultSchema.parse(messages[0]?.data)).toEqual({
      verdict: 'block',
      keywords: ['bad word'],
      hits: [{ label: 'other', providerLabel: 'keyword', keywords: ['bad word'] }],
      provider: 'keyword'
    });
  });

  it('reports a framework-level error when the provider result does not match the contract', async () => {
    const messages = await runCheck({
      provider: {
        name: 'keyword',
        check: async () => ({ hits: [] }) as never
      },
      payload: { content: 'x' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(String(messages[0]?.data)).toContain('verdict');
  });

  it('rejects legacy modality fields rather than silently treating their content as text', async () => {
    const check = vi.fn(async () => ({ verdict: 'pass' as const, hits: [] }));
    const messages = await runCheck({
      provider: { name: 'keyword', check },
      payload: { content: 'x', modality: 'image' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(String(messages[0]?.data)).toContain('modality');
    expect(check).not.toHaveBeenCalled();
  });

  it('rejects the obsolete status/result envelope from a provider', async () => {
    const messages = await runCheck({
      provider: {
        name: 'keyword',
        check: async () => ({
          verdict: 'pass',
          hits: [],
          status: 'done',
          result: { verdict: 'pass', hits: [] }
        }) as never
      },
      payload: { content: 'x' }
    });

    expect(messages[0]?.type).toBe('error');
    expect(String(messages[0]?.data)).toContain('Unrecognized keys');
  });

  it('treats an uncaught provider exception as a framework failure, not an error verdict', async () => {
    const provider: ModerationProvider = {
      name: 'keyword',
      check: async () => {
        throw new Error('boom');
      }
    };

    const messages = await runCheck({ provider, payload: { content: 'x' } });

    expect(messages[0]).toEqual({ type: 'error', data: 'boom' });
  });

  it('validates secrets only when secretSchema is declared and never strips undeclared ones', async () => {
    const captured: Record<string, unknown>[] = [];
    const provider: ModerationProvider = {
      name: 'keyword',
      check: async (_input, ctx) => {
        captured.push(ctx.secrets);
        return { verdict: 'pass', hits: [] };
      }
    };

    const mismatched = await runCheck({
      provider,
      secretSchema: z.object({ apiKey: z.string() }),
      payload: { content: 'x' },
      secrets: { apiKey: 123 }
    });
    expect(mismatched[0]?.type).toBe('error');
    expect(captured).toHaveLength(0);

    await runCheck({
      provider,
      secretSchema: z.object({ apiKey: z.string() }),
      payload: { content: 'x' },
      secrets: { apiKey: 'x', extra: 'y' }
    });
    expect(captured[0]).toEqual({ apiKey: 'x' });

    await runCheck({
      provider,
      payload: { content: 'x' },
      secrets: { anything: 1 }
    });
    expect(captured[1]).toEqual({ anything: 1 });
  });

  it('turns moderationError into a valid error verdict result', async () => {
    const provider: ModerationProvider = {
      name: 'keyword',
      check: async (_input, ctx: ModerationProviderContext) =>
        ctx.moderationError('upstream timeout')
    };

    const messages = await runCheck({ provider, payload: { content: 'x' } });
    const parsed = ModerationResultSchema.parse(messages[0]?.data);

    expect(parsed.verdict).toBe('error');
    expect(parsed.errorMessage).toBe('upstream timeout');
    expect(parsed.hits).toEqual([]);
  });

  it('types ctx.secrets from the declared secretSchema, and as an untyped record otherwise', async () => {
    const secretSchema = z.object({ apiKey: z.string() });
    const fromSchema: ModerationProvider<typeof secretSchema> = {
      name: 'keyword',
      check: async (_input, ctx): Promise<ModerationProviderResultType> => {
        const apiKey: string = ctx.secrets.apiKey;
        return { verdict: apiKey ? 'pass' : 'block', hits: [] };
      }
    };

    const messages = await runCheck({
      provider: fromSchema,
      secretSchema,
      payload: { content: 'x' },
      secrets: { apiKey: 'k' }
    });
    expect(ModerationResultSchema.parse(messages[0]?.data).verdict).toBe('pass');

    const untyped: ModerationProvider = {
      name: 'keyword',
      check: async (_input, ctx) => ({
        verdict: Object.keys(ctx.secrets).length > 0 ? 'pass' : 'block',
        hits: []
      })
    };

    const passthrough = await runCheck({
      provider: untyped,
      payload: { content: 'x' },
      secrets: { anything: 1 }
    });
    expect(ModerationResultSchema.parse(passthrough[0]?.data).verdict).toBe('pass');
  });
});
