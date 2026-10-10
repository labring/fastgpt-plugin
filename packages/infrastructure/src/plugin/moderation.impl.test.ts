import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ModerationType } from '@domain/entities/moderation.entity';
import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginStreamMessageType } from '@domain/value-objects/plugin-stream.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

import { ModerationManager, type ModerationManagerDeps } from './moderation.impl';

const listVersions = vi.fn();
const getPluginByUserPluginId = vi.fn();
const invoke = vi.fn();

const SYSTEM_VAR = {
  app: { id: 'app', name: 'App' },
  chat: { chatId: 'chat', uid: 'user' },
  invokeToken: 'token',
  time: '2026-01-01T00:00:00.000Z'
} as const;

const makeModeration = (overrides: Partial<ModerationType> = {}): ModerationType =>
  ({
    pluginId: 'moderation-a',
    version: '1.0.0',
    etag: 'etag-a',
    type: PluginTypeEnum.moderation,
    name: { en: 'Moderation A', 'zh-CN': '审查 A' },
    icon: 'https://example.com/icon.svg',
    description: { en: 'Moderation A', 'zh-CN': '审查 A' },
    meta: { provider: 'keyword' },
    ...overrides
  }) as ModerationType;

/** 构造一个只发指定帧的输出流 */
function createStream(...messages: PluginStreamMessageType[]): StreamData<PluginStreamMessageType> {
  const stream = StreamData.create<PluginStreamMessageType>();
  for (const message of messages) {
    stream.send(message);
  }
  stream.close();
  return stream;
}

function createManager(deps?: Partial<ModerationManagerDeps>): ModerationManager {
  (ModerationManager as unknown as { instance?: ModerationManager }).instance = undefined;
  return ModerationManager.getInstance({
    pluginRepo: {
      listVersions,
      getPluginByUserPluginId
    } as unknown as PluginRepoPort,
    pluginRuntimeManager: {
      invoke
    } as unknown as PluginRuntimeManagerPort,
    fastgptBaseUrl: 'https://fastgpt.example.com',
    ...deps
  } satisfies ModerationManagerDeps);
}

const checkInput = (overrides: Record<string, unknown> = {}) => ({
  pluginId: 'moderation-a',
  input: { content: 'hello' },
  systemVar: SYSTEM_VAR,
  ...overrides
});

describe('ModerationManager.check', () => {
  beforeEach(() => {
    listVersions.mockReset();
    getPluginByUserPluginId.mockReset();
    invoke.mockReset();
    getPluginByUserPluginId.mockResolvedValue(successResult(makeModeration()));
  });

  it('returns the moderation result from the response frame', async () => {
    invoke.mockResolvedValue(
      successResult(
        createStream({
          type: 'response',
          data: { verdict: 'pass', keywords: [], hits: [], provider: 'keyword' }
        })
      )
    );

    const [result, err] = await createManager().check(checkInput());

    expect(err).toBeNull();
    expect(result).toEqual({ verdict: 'pass', keywords: [], hits: [], provider: 'keyword' });
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'check', returnStream: true })
    );
  });

  it('fails with a streaming-specific reason when the plugin emits a stream frame', async () => {
    invoke.mockResolvedValue(
      successResult(createStream({ type: 'stream', data: { type: 'answer', content: 'x' } }))
    );

    const [, err] = await createManager().check(checkInput());

    expect(err?.reason.en).toContain('does not support streaming output');
  });

  it('fails with the plugin error text when the plugin emits an error frame', async () => {
    invoke.mockResolvedValue(successResult(createStream({ type: 'error', data: 'upstream timeout' })));

    const [, err] = await createManager().check(checkInput());

    expect(err?.reason.en).toContain('upstream timeout');
  });

  it('fails when the response frame does not match the standard structure', async () => {
    invoke.mockResolvedValue(successResult(createStream({ type: 'response', data: { verdict: 'pass' } })));

    const [, err] = await createManager().check(checkInput());

    expect(err?.reason.en).toBe('Plugin returned data that does not match the standard structure');
    expect(err?.data).toHaveProperty('issues');
  });

  it('fails when the plugin returns no response frame', async () => {
    invoke.mockResolvedValue(successResult(createStream()));

    const [, err] = await createManager().check(checkInput());

    expect(err?.reason.en).toBe('Plugin returned no result');
  });


  it('rejects a plugin whose type is not moderation', async () => {
    getPluginByUserPluginId.mockResolvedValue(
      successResult({ ...makeModeration(), type: PluginTypeEnum.tool })
    );

    const [, err] = await createManager().check(checkInput());

    expect(err?.code).toBe('plugin.runtime.plugin_not_found');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('forwards the plugin lookup failure', async () => {
    getPluginByUserPluginId.mockResolvedValue(
      failureResult({ en: 'Plugin not found', 'zh-CN': '插件未找到' })
    );

    const [, err] = await createManager().check(checkInput());

    expect(err?.code).toBe('plugin.runtime.plugin_not_found');
  });
});

describe('ModerationManager.detail', () => {
  beforeEach(() => {
    listVersions.mockReset();
    getPluginByUserPluginId.mockReset();
    invoke.mockReset();
  });

  it('returns the moderation detail with source and latest-version flag', async () => {
    listVersions.mockResolvedValue(successResult([{ version: '1.0.0' }, { version: '2.0.0' }]));
    getPluginByUserPluginId.mockResolvedValue(successResult(makeModeration({ version: '2.0.0' })));

    const [result, err] = await createManager().detail({ pluginId: 'moderation-a', source: 'system' });

    expect(err).toBeNull();
    expect(result).toMatchObject({ source: 'system', isLatestVersion: true, version: '2.0.0' });
  });

  it('rejects a plugin whose type is not moderation', async () => {
    listVersions.mockResolvedValue(successResult([{ version: '1.0.0' }]));
    getPluginByUserPluginId.mockResolvedValue(
      successResult({ ...makeModeration(), type: PluginTypeEnum.tool })
    );

    const [, err] = await createManager().detail({ pluginId: 'moderation-a', source: 'system' });

    expect(err?.code).toBe('plugin.runtime.plugin_not_found');
    expect(err?.reason.en).toBe('Requested plugin is not a moderation plugin');
  });
});
