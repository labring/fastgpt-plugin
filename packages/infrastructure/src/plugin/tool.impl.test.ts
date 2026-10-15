import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginTypeEnum } from '@domain/entities/plugin-base.entity';
import type { ToolType } from '@domain/entities/tool.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { createError } from '@domain/value-objects/error.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

import { ToolManager, type ToolManagerDeps } from './tool.impl';

const listVersions = vi.fn();
const getPluginByUserPluginId = vi.fn();
const invoke = vi.fn();

const makeTool = (version: string): ToolType => ({
  pluginId: 'getTime',
  version,
  etag: `etag-${version}`,
  type: PluginTypeEnum.tool,
  name: {
    en: 'Get Time',
    'zh-CN': '获取时间'
  },
  icon: 'https://example.com/icon.svg',
  description: {
    en: 'Get current time',
    'zh-CN': '获取当前时间'
  },
});

function createToolManager(deps?: Partial<ToolManagerDeps>): ToolManager {
  (ToolManager as unknown as { instance?: ToolManager }).instance = undefined;
  return ToolManager.getInstance({
    pluginRepo: {
      listVersions,
      getPluginByUserPluginId
    } as unknown as PluginRepoPort,
    pluginRuntimeManager: {
      invoke
    } as unknown as PluginRuntimeManagerPort,
    fastgptBaseUrl: 'https://fastgpt.example.com',
    ...deps
  } satisfies ToolManagerDeps);
}

describe('ToolManager.detail', () => {
  beforeEach(() => {
    listVersions.mockReset();
    getPluginByUserPluginId.mockReset();
    invoke.mockReset();
  });

  it('returns the original missing-version error when fallbackLatestVersion is disabled', async () => {
    const toolManager = createToolManager();
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
    const toolManager = createToolManager();
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

  it('drops legacy description metadata and preserves parameter selection in tool detail', async () => {
    const toolManager = createToolManager();
    listVersions.mockResolvedValue(successResult([{ version: '1.0.0' }]));
    const localizedToolDescription = {
      en: 'Search public documentation',
      'zh-CN': '搜索公开文档'
    };
    getPluginByUserPluginId.mockResolvedValue(
      successResult({
        ...makeTool('1.0.0'),
        toolDescription: localizedToolDescription,
        description: { en: 'canonical', 'zh-CN': '唯一描述' },
        inputSchema: {
          type: 'object',
          properties: {
            withToolDescription: {
              type: 'string',
              toolDescription: 'Existing model-facing description'
            },
            localizedToolDescription: {
              type: 'string',
              toolDescription: localizedToolDescription,
              description: 'Canonical field description'
            },
            manualByDefault: {
              type: 'string',
              description: {
                en: 'Fallback manual description',
                'zh-CN': '手动参数说明'
              }
            },
            explicitFalse: {
              type: 'string',
              toolDescription: 'Legacy metadata must not override this flag',
              isToolParam: false
            },
            explicitTrue: {
              type: 'string',
              description: { en: 'Explicit true' },
              isToolParam: true
            }
          },
          allOf: [
            {
              properties: {
                nested: { type: 'string', toolDescription: 'Nested legacy metadata' }
              }
            }
          ],
          items: [{ type: 'string', toolDescription: 'Array legacy metadata' }]
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'string', toolDescription: 'Output legacy metadata' }
          }
        },
        secretSchema: {
          type: 'object',
          properties: {
            token: { type: 'string', toolDescription: 'Secret legacy metadata' }
          }
        },
        children: [
          {
            id: 'child',
            name: { en: 'Child', 'zh-CN': '子工具' },
            description: { en: 'Child tool', 'zh-CN': '子工具' },
            icon: 'https://example.com/child.svg',
            toolDescription: localizedToolDescription,
            inputSchema: {
              type: 'object',
              properties: {
                childParam: {
                  type: 'string',
                  toolDescription: localizedToolDescription,
                  description: { en: 'Child canonical description' }
                }
              }
            },
            outputSchema: {
              type: 'object',
              properties: {
                childResult: { type: 'string', toolDescription: 'Child output legacy metadata' }
              }
            }
          }
        ]
      } as unknown as ToolType)
    );

    const [result, err] = await toolManager.detail({
      pluginId: 'getTime',
      source: 'system',
      version: '1.0.0'
    });

    const inputSchema = result?.inputSchema as {
      properties: Record<string, Record<string, unknown>>;
      allOf: Array<{ properties: Record<string, Record<string, unknown>> }>;
      items: Array<Record<string, unknown>>;
    };
    const childInputSchema = result?.children?.[0]?.inputSchema as {
      properties: Record<string, Record<string, unknown>>;
    };

    expect(err).toBeNull();
    expect(result?.description).toEqual({ en: 'canonical', 'zh-CN': '唯一描述' });
    expect(result).not.toHaveProperty('toolDescription');
    expect(result?.children?.[0]).not.toHaveProperty('toolDescription');
    expect(inputSchema.properties.withToolDescription).not.toHaveProperty('toolDescription');
    expect(inputSchema.properties.withToolDescription.isToolParam).toBe(false);
    expect(inputSchema.properties.localizedToolDescription).toMatchObject({
      description: 'Canonical field description',
      isToolParam: false
    });
    expect(inputSchema.properties.localizedToolDescription).not.toHaveProperty('toolDescription');
    expect(inputSchema.properties.manualByDefault).toMatchObject({ isToolParam: false });
    expect(inputSchema.properties.explicitFalse.isToolParam).toBe(false);
    expect(inputSchema.properties.explicitTrue.isToolParam).toBe(true);
    expect(inputSchema.allOf[0].properties.nested).not.toHaveProperty('toolDescription');
    expect(inputSchema.items[0]).not.toHaveProperty('toolDescription');
    expect(result?.outputSchema).toEqual({
      type: 'object',
      properties: { result: { type: 'string' } }
    });
    expect(result?.secretSchema).toEqual({
      type: 'object',
      properties: { token: { type: 'string' } }
    });
    expect(childInputSchema.properties.childParam).toMatchObject({
      description: { en: 'Child canonical description' },
      isToolParam: false
    });
    expect(childInputSchema.properties.childParam).not.toHaveProperty('toolDescription');
    expect(result?.children?.[0]?.outputSchema).toEqual({
      type: 'object',
      properties: { childResult: { type: 'string' } }
    });
  });
});

describe('ToolManager.run', () => {
  beforeEach(() => {
    listVersions.mockReset();
    getPluginByUserPluginId.mockReset();
    invoke.mockReset();
  });

  it('returns plugin invoke errors with code and diagnostic context', async () => {
    const toolManager = createToolManager();
    const timeoutError = createError(ErrorCode.pluginInvokeTimeout, {
      reason: {
        en: 'Plugin invocation timed out after 30000ms while handling event "run"',
        'zh-CN': '插件调用超时（30000ms），事件：run'
      },
      data: {
        method: 'run',
        timeoutMs: 30000
      },
      cause: Object.assign(new Error('Request timeout'), {
        code: 'REQUEST_TIMEOUT',
        method: 'run',
        timeoutMs: 30000
      })
    });
    getPluginByUserPluginId.mockResolvedValue(successResult(makeTool('1.10.0')));
    invoke.mockResolvedValue(failureResult(timeoutError));

    const [, err] = await toolManager.run({
      pluginId: 'getTime',
      source: 'system',
      version: '1.10.0',
      childId: 'now',
      input: {
        timezone: 'Asia/Shanghai'
      },
      secrets: {
        apiKey: 'should-not-be-copied'
      },
      systemVar: {
        app: {
          id: 'app-1',
          name: 'Demo'
        },
        chat: {
          chatId: 'chat-1',
          uid: 'user-1'
        },
        invokeToken: 'secret-token',
        time: '2026-06-05T00:00:00.000Z'
      }
    });

    expect(err).toMatchObject({
      code: ErrorCode.pluginInvokeTimeout,
      data: {
        method: 'run',
        timeoutMs: 30000,
        pluginId: 'getTime',
        source: 'system',
        version: '1.10.0',
        childId: 'now',
        input: {
          timezone: 'Asia/Shanghai'
        }
      }
    });
    expect(err?.data).not.toHaveProperty('secrets');
    expect(err?.data).not.toHaveProperty('systemVar');
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        uniqueId: {
          etag: 'etag-1.10.0',
          pluginId: 'getTime',
          version: '1.10.0'
        },
        eventName: 'run',
        payload: expect.objectContaining({
          input: {
            timezone: 'Asia/Shanghai'
          },
          childId: 'now'
        })
      })
    );
  });

  it('returns plugin lookup errors with code and diagnostic context', async () => {
    const toolManager = createToolManager();
    getPluginByUserPluginId.mockResolvedValue(
      failureResult({
        en: 'Plugin not found',
        'zh-CN': '插件未找到'
      })
    );

    const [, err] = await toolManager.run({
      pluginId: '',
      source: '',
      childId: 'now',
      input: {},
      systemVar: {
        app: {
          id: '',
          name: ''
        },
        chat: {
          chatId: '',
          uid: ''
        },
        invokeToken: '',
        time: ''
      }
    });

    expect(err).toMatchObject({
      code: ErrorCode.pluginRuntimePluginNotFound,
      message: 'Failed to get plugin by plugin id',
      data: {
        pluginId: '',
        source: '',
        childId: 'now',
        input: {}
      }
    });
    expect(err?.data).not.toHaveProperty('secrets');
    expect(err?.data).not.toHaveProperty('systemVar');
    expect(invoke).not.toHaveBeenCalled();
  });
});
