import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';
import type { ToolType } from '@domain/entities/tool.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { ToolManager, type ToolManagerDeps } from './tool.impl';

const listVersions = vi.fn();
const getPluginByUserPluginId = vi.fn();

const toolManager = ToolManager.getInstance({
  pluginRepo: {
    listVersions,
    getPluginByUserPluginId
  } as unknown as PluginRepoPort,
  pluginRuntimeManager: {} as PluginRuntimeManagerPort,
  fastgptBaseUrl: 'https://fastgpt.example.com'
} satisfies ToolManagerDeps);

const makeTool = (version: string): ToolType => ({
  pluginId: 'getTime',
  version,
  etag: `etag-${version}`,
  type: PluginTypeEnum.tool,
  name: {
    en: 'Get Time'
  },
  icon: 'https://example.com/icon.svg',
  description: {
    en: 'Get current time'
  },
  toolDescription: 'Get current time'
});

describe('ToolManager.detail', () => {
  beforeEach(() => {
    listVersions.mockReset();
    getPluginByUserPluginId.mockReset();
  });

  it('returns the original missing-version error when fallbackLatestVersion is disabled', async () => {
    listVersions.mockResolvedValue(successResult([{ version: '1.0.0' }, { version: '2.0.0' }]));
    getPluginByUserPluginId.mockResolvedValue(
      failureResult({
        en: 'Plugin not found',
        'zh-CN': '插件未找到'
      })
    );

    const [result, err] = await toolManager.detail({
      pluginId: 'getTime',
      source: 'system',
      version: '9.9.9'
    });

    expect(result).toBeNull();
    expect(err?.reason.en).toBe('Failed to get tool detail');
    expect(getPluginByUserPluginId).toHaveBeenCalledTimes(1);
    expect(getPluginByUserPluginId).toHaveBeenCalledWith({
      pluginId: 'getTime',
      source: 'system',
      version: '9.9.9'
    });
  });

  it('falls back to latest version when requested version is missing and fallbackLatestVersion is enabled', async () => {
    listVersions.mockResolvedValue(
      successResult([{ version: '1.0.0' }, { version: '1.10.0' }, { version: '1.2.0' }])
    );
    getPluginByUserPluginId
      .mockResolvedValueOnce(
        failureResult({
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        })
      )
      .mockResolvedValueOnce(successResult(makeTool('1.10.0')));

    const [result, err] = await toolManager.detail({
      pluginId: 'getTime',
      source: 'system',
      version: '9.9.9',
      fallbackLatestVersion: true
    });

    expect(err).toBeNull();
    expect(result?.version).toBe('1.10.0');
    expect(result?.source).toBe('system');
    expect(result?.isLatestVersion).toBe(true);
    expect(getPluginByUserPluginId).toHaveBeenNthCalledWith(1, {
      pluginId: 'getTime',
      source: 'system',
      version: '9.9.9'
    });
    expect(getPluginByUserPluginId).toHaveBeenNthCalledWith(2, {
      pluginId: 'getTime',
      source: 'system',
      version: '1.10.0'
    });
  });
});
