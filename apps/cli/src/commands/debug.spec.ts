import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDebugGateway } from '@fastgpt-plugin/cli/debug/gateway';
import { loadDebugSession } from '@fastgpt-plugin/cli/debug/session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../cmd';
import { logger } from '../helpers';

const { connectDebugGatewayMock, inputMock, selectMock } = vi.hoisted(() => ({
  connectDebugGatewayMock: vi.fn(),
  inputMock: vi.fn(),
  selectMock: vi.fn()
}));

vi.mock('@fastgpt-plugin/cli/debug/gateway', () => ({
  connectDebugGateway: connectDebugGatewayMock
}));

vi.mock('@inquirer/prompts', () => ({
  input: inputMock,
  select: selectMock
}));

const FIXTURE_ROOT = fileURLToPath(new URL('../../../../test/fixtures/', import.meta.url));
const GETTIME_TOOL_DIR = path.join(FIXTURE_ROOT, 'tools', 'getTime');
const DBOPS_SUITE_DIR = path.join(FIXTURE_ROOT, 'tool-suites', 'dbops');
const UPLOAD_FILE_TOOL_DIR = path.join(FIXTURE_ROOT, 'tools', 'uploadFileEcho');

describe('debug command', () => {
  const loggerSpy = {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  };
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let tempUploadDir: string;
  let configHome: string;

  beforeEach(async () => {
    configHome = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-cli-config-'));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
    vi.spyOn(logger, 'warn').mockImplementation(loggerSpy.warn);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: makeConnectedSession(options),
      close: vi.fn(),
      closed: Promise.resolve().then(() => undefined),
      updateTargets: vi.fn()
    }));
    connectDebugGatewayMock.mockClear();
    tempUploadDir = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-debug-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    loggerSpy.success.mockReset();
    loggerSpy.info.mockReset();
    loggerSpy.error.mockReset();
    loggerSpy.warn.mockReset();
    vi.unstubAllGlobals();
    inputMock.mockReset();
    delete process.env.CONNECTION_GATEWAY_AUTH_TOKEN;
    delete process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL;
    delete process.env.FASTGPT_PLUGIN_SERVER_URL;
    delete process.env.PLUGIN_SERVER_URL;
    delete process.env.XDG_CONFIG_HOME;
    await rm(tempUploadDir, { recursive: true, force: true });
    await rm(configHome, { recursive: true, force: true });
  });

  it('应能输出单工具的本地调试信息和调用命令，默认使用简体中文', async () => {
    await run([process.execPath, 'cli', 'debug', GETTIME_TOOL_DIR]);

    const output = getLoggerOutput(loggerSpy.info);

    expect(output).toContain('pluginId: getTime');
    expect(output).toContain('name: 获取当前时间');
    expect(output).toContain('description: 获取当前时间');
    expect(output).toContain('可调试工具');
    expect(output).toContain('fastgpt-plugin debug');
    expect(output).toContain('--run');
    expect(output).toContain('--lang zh-CN');
    expect(output).toContain('--input');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能按 --lang 选择工具和插件调试元数据语言', async () => {
    await run([process.execPath, 'cli', 'debug', GETTIME_TOOL_DIR, '--lang', 'en']);

    const englishOutput = getLoggerOutput(loggerSpy.info);
    expect(englishOutput).toContain('name: Get current time');
    expect(englishOutput).toContain('description: Get current time');
    expect(englishOutput).toContain('--lang en');

    loggerSpy.info.mockClear();
    await run([process.execPath, 'cli', 'debug', DBOPS_SUITE_DIR, '--lang', 'en']);

    const toolsetOutput = getLoggerOutput(loggerSpy.info);
    expect(toolsetOutput).toContain('name: DB Operations');
    expect(toolsetOutput).toContain('name: MySQL Tool');
    expect(toolsetOutput).toContain('description: MySQL database operation tool');
    expect(toolsetOutput).toContain('--tool mysql');
    expect(toolsetOutput).toContain('--tool pgsql');
    expect(toolsetOutput).toContain('--lang en');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('指定语言缺失时应优先回退到简体中文', async () => {
    await run([process.execPath, 'cli', 'debug', GETTIME_TOOL_DIR, '--lang', 'zh-Hant']);

    const output = getLoggerOutput(loggerSpy.info);

    expect(output).toContain('name: 获取当前时间');
    expect(output).not.toContain('name: Get current time');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('目标语言存在时应优先于简体中文和英文', async () => {
    const entryDir = await createDebugPluginFixture({
      name: {
        en: 'English name',
        'zh-CN': '简体中文名称',
        'zh-Hant': '繁體中文名稱'
      },
      description: {
        en: 'English description',
        'zh-CN': '简体中文说明',
        'zh-Hant': '繁體中文說明'
      },
      toolDescription: {
        en: 'English tool description',
        'zh-CN': '简体中文工具说明',
        'zh-Hant': '繁體中文工具說明'
      }
    });

    try {
      const { snapshot } = await loadDebugSession({
        entryDir,
        uploadDir: tempUploadDir
      });
      expect(snapshot.name).toEqual({
        en: 'English name',
        'zh-CN': '简体中文名称',
        'zh-Hant': '繁體中文名稱'
      });
      expect(snapshot.description).toEqual({
        en: 'English description',
        'zh-CN': '简体中文说明',
        'zh-Hant': '繁體中文說明'
      });
      expect(snapshot.toolDescription).toEqual({
        en: 'English tool description',
        'zh-CN': '简体中文工具说明',
        'zh-Hant': '繁體中文工具說明'
      });
      expect(snapshot.tools[0]).toMatchObject({
        name: {
          en: 'English name',
          'zh-CN': '简体中文名称',
          'zh-Hant': '繁體中文名稱'
        },
        description: {
          en: 'English description',
          'zh-CN': '简体中文说明',
          'zh-Hant': '繁體中文說明'
        },
        toolDescription: {
          en: 'English tool description',
          'zh-CN': '简体中文工具说明',
          'zh-Hant': '繁體中文工具說明'
        }
      });

      await run([process.execPath, 'cli', 'debug', entryDir, '--lang', 'zh-Hant']);

      const output = getLoggerOutput(loggerSpy.info);

      expect(output).toContain('name: 繁體中文名稱');
      expect(output).toContain('description: 繁體中文說明');
      expect(output).toContain('toolDescription: 繁體中文工具說明');
      expect(output).not.toContain('简体中文');
      expect(loggerSpy.error).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      await rm(entryDir, { recursive: true, force: true });
    }
  });

  it('简体中文缺失时回退到英文，并继续接受旧字符串 metadata', async () => {
    const entryDir = await createDebugPluginFixture({
      name: { en: 'English fallback name', 'zh-CN': '' },
      description: 'Legacy debug description',
      toolDescription: 'Legacy model description'
    });

    try {
      await run([process.execPath, 'cli', 'debug', entryDir, '--lang', 'zh-Hant']);

      const output = getLoggerOutput(loggerSpy.info);

      expect(output).toContain('name: English fallback name');
      expect(output).toContain('description: Legacy debug description');
      expect(output).toContain('toolDescription: Legacy model description');
      expect(output).toContain('    toolDescription: Legacy model description');
      expect(loggerSpy.error).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      await rm(entryDir, { recursive: true, force: true });
    }
  });

  it('应能直接运行本地单工具调试', async () => {
    await run([process.execPath, 'cli', 'debug', GETTIME_TOOL_DIR, '--run', '--input', '{}']);

    const successOutput = getLoggerOutput(loggerSpy.success);
    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(successOutput).toContain('本地调试执行完成: getTime');
    expect(infoOutput).toContain('虚拟时间:');
    expect(infoOutput).toContain('"time"');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能通过虚拟宿主完成 uploadFile 反向调用', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      UPLOAD_FILE_TOOL_DIR,
      '--run',
      '--input',
      '{"content":"hello upload"}',
      '--upload-dir',
      tempUploadDir
    ]);

    const files = await readdir(tempUploadDir);
    expect(files.length).toBe(1);

    const uploadedContent = await readFile(path.join(tempUploadDir, files[0]), 'utf-8');
    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(uploadedContent).toBe('hello upload');
    expect(infoOutput).toContain('"fileName": "echo.txt"');
    expect(infoOutput).toContain('"accessURL"');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能通过 connect link 换取预创建远程调试连接信息', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              fastgptBaseUrl: 'https://fastgpt-main.example.com',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--connect',
      'https://fastgpt.example.com/debug/connect?connectionKey=t1'
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?connectionKey=t1'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
      connectToken: 'scoped-token',
      source: 'debug:tmbId:tmb-1',
      userId: 'tmb-1',
      fastgptBaseUrl: 'https://fastgpt-main.example.com'
    });
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).not.toHaveProperty(
      'authToken'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).not.toHaveProperty(
      'jwtSecret'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.warn)).toContain('debug --connect 是兼容入口');
  });

  it('应能通过长期 connection key 换取远程调试连接信息', async () => {
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    await run([
      process.execPath,
      'cli',
      'dev',
      GETTIME_TOOL_DIR,
      '--connect',
      'connection-key-1',
      '--no-interactive'
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          connectionKey: 'connection-key-1'
        })
      })
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
      connectToken: 'scoped-token',
      source: 'debug:tmbId:tmb-1',
      userId: 'tmb-1'
    });
  });
});

describe('dev command', () => {
  const loggerSpy = {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  };
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let configHome: string;

  beforeEach(async () => {
    configHome = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-cli-config-'));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
    vi.spyOn(logger, 'warn').mockImplementation(loggerSpy.warn);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: makeConnectedSession(options),
      close: vi.fn(),
      closed: Promise.resolve(),
      updateTargets: vi.fn()
    }));
    connectDebugGatewayMock.mockClear();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    loggerSpy.success.mockReset();
    loggerSpy.info.mockReset();
    loggerSpy.error.mockReset();
    loggerSpy.warn.mockReset();
    vi.unstubAllGlobals();
    inputMock.mockReset();
    delete process.env.CONNECTION_GATEWAY_AUTH_TOKEN;
    delete process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL;
    delete process.env.FASTGPT_PLUGIN_SERVER_URL;
    delete process.env.PLUGIN_SERVER_URL;
    delete process.env.XDG_CONFIG_HOME;
    await rm(configHome, { recursive: true, force: true });
  });

  it('应能通过 dev --connect 启动集成开发会话', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    await run([
      process.execPath,
      'cli',
      'dev',
      GETTIME_TOOL_DIR,
      DBOPS_SUITE_DIR,
      '--connect',
      'https://fastgpt.example.com/debug/connect?connectionKey=t1',
      '--no-interactive'
    ]);

    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?connectionKey=t1'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].targets).toHaveLength(2);
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
      connectToken: 'scoped-token',
      source: 'debug:tmbId:tmb-1'
    });
    expect(infoOutput).toContain('FastGPT 插件开发会话');
    expect(infoOutput).toContain('command: fastgpt-plugin dev');
    expect(infoOutput).toContain('ui: plain');
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1 dbops'
    );
    expect(loggerSpy.warn).not.toHaveBeenCalled();
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('dev 未指定插件目录时应自动发现当前目录下的插件', async () => {
    const workspaceDir = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-dev-discover-'));
    await copyDebugFixture(GETTIME_TOOL_DIR, path.join(workspaceDir, 'getTime'));
    await copyDebugFixture(DBOPS_SUITE_DIR, path.join(workspaceDir, 'dbops'));
    const previousCwd = process.cwd();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    try {
      process.chdir(workspaceDir);
      await run([
        process.execPath,
        'cli',
        'dev',
        '--connect',
        'https://fastgpt.example.com/debug/connect?connectionKey=t1',
        '--no-interactive'
      ]);
    } finally {
      process.chdir(previousCwd);
      await rm(workspaceDir, { recursive: true, force: true });
    }

    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(infoOutput).toContain('自动发现 2 个可调试插件');
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].targets).toHaveLength(2);
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1 dbops'
    );
  });

  it('dev 未传 --connect 时应在交互式终端提示输入 connection key', async () => {
    inputMock.mockResolvedValue('https://fastgpt.example.com/debug/connect?connectionKey=t1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );
    const stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      get: () => true
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => true
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      await run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR]);

      expect(inputMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'FastGPT connection key'
        })
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://fastgpt.example.com/debug/connect?connectionKey=t1'
      );
      await expect(
        readFile(path.join(configHome, 'fastgpt-plugin', 'config.json'), 'utf-8')
      ).resolves.toContain('https://fastgpt.example.com/debug/connect?connectionKey=t1');
    } finally {
      restorePropertyDescriptor(process.stdin, 'isTTY', stdinIsTTY);
      restorePropertyDescriptor(process.stdout, 'isTTY', stdoutIsTTY);
    }
  });

  it('dev 未传 --connect 时应优先读取本地 connection key 配置', async () => {
    const configDir = path.join(configHome, 'fastgpt-plugin');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        debug: {
          connectionKey: 'connection-key-from-config'
        }
      })
    );
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    await run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR, '--no-interactive']);

    expect(inputMock).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          connectionKey: 'connection-key-from-config'
        })
      })
    );
    expect(getLoggerOutput(loggerSpy.info)).toContain('已读取本地 FastGPT connection key 配置');
  });

  it('dev --connect 启动成功后应覆盖本地 connection key 配置', async () => {
    const configDir = path.join(configHome, 'fastgpt-plugin');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        debug: {
          connectionKey: 'old-key'
        }
      })
    );
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );

    await run([
      process.execPath,
      'cli',
      'dev',
      GETTIME_TOOL_DIR,
      '--connect',
      'new-key',
      '--no-interactive'
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          connectionKey: 'new-key'
        })
      })
    );
    const savedConfig = JSON.parse(
      await readFile(path.join(configHome, 'fastgpt-plugin', 'config.json'), 'utf-8')
    );
    expect(savedConfig.debug.connectionKey).toBe('new-key');
    expect(getLoggerOutput(loggerSpy.info)).toContain('已保存 FastGPT connection key 到本地配置');
  });

  it('交互式 dev 读取本地 connection key 失败时应允许重新输入并保存新 key', async () => {
    const configDir = path.join(configHome, 'fastgpt-plugin');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        debug: {
          connectionKey: 'bad-key'
        }
      })
    );
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('connection key expired', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    inputMock.mockResolvedValue('good-key');
    const stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      get: () => true
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => true
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      await run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR]);

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            connectionKey: 'bad-key'
          })
        })
      );
      expect(inputMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'FastGPT connection key',
          default: 'bad-key'
        })
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            connectionKey: 'good-key'
          })
        })
      );
      expect(getLoggerOutput(loggerSpy.error)).toContain(
        'connection key 请求失败: 500 connection key expired'
      );
      const savedConfig = JSON.parse(
        await readFile(path.join(configHome, 'fastgpt-plugin', 'config.json'), 'utf-8')
      );
      expect(savedConfig.debug.connectionKey).toBe('good-key');
    } finally {
      restorePropertyDescriptor(process.stdin, 'isTTY', stdinIsTTY);
      restorePropertyDescriptor(process.stdout, 'isTTY', stdoutIsTTY);
    }
  });

  it('交互式 dev 读取本地 connection key 失败后空输入应保留原值重试', async () => {
    const configDir = path.join(configHome, 'fastgpt-plugin');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        debug: {
          connectionKey: 'retry-key'
        }
      })
    );
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('gateway unavailable', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    inputMock.mockResolvedValue('retry-key');
    const stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      get: () => true
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => true
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      await run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR]);

      expect(inputMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'FastGPT connection key',
          default: 'retry-key'
        })
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            connectionKey: 'retry-key'
          })
        })
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            connectionKey: 'retry-key'
          })
        })
      );
      const savedConfig = JSON.parse(
        await readFile(path.join(configHome, 'fastgpt-plugin', 'config.json'), 'utf-8')
      );
      expect(savedConfig.debug.connectionKey).toBe('retry-key');
    } finally {
      restorePropertyDescriptor(process.stdin, 'isTTY', stdinIsTTY);
      restorePropertyDescriptor(process.stdout, 'isTTY', stdoutIsTTY);
    }
  });

  it('非交互 dev 读取本地 connection key 失败时应直接抛错', async () => {
    const configDir = path.join(configHome, 'fastgpt-plugin');
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, 'config.json'),
      JSON.stringify({
        debug: {
          connectionKey: 'bad-key'
        }
      })
    );
    process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL =
      'https://fastgpt.example.com/api/plugin/debug-sessions/connection-key:exchange';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('connection key expired', { status: 500 }))
    );

    await expect(
      run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR, '--no-interactive'])
    ).rejects.toThrow('connection key 请求失败: 500 connection key expired');
    expect(inputMock).not.toHaveBeenCalled();
    const savedConfig = JSON.parse(
      await readFile(path.join(configHome, 'fastgpt-plugin', 'config.json'), 'utf-8')
    );
    expect(savedConfig.debug.connectionKey).toBe('bad-key');
  });

  it('交互式 dev 首次 Ctrl+C 应关闭会话，第二次应强制退出', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );
    const closeMock = vi.fn();
    let resolveClosed: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: makeConnectedSession(options),
      close: closeMock,
      closed,
      updateTargets: vi.fn()
    }));
    const stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    const stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      get: () => true
    });
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => true
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      const runPromise = run([
        process.execPath,
        'cli',
        'dev',
        GETTIME_TOOL_DIR,
        '--connect',
        'https://fastgpt.example.com/debug/connect?connectionKey=t1'
      ]);

      await vi.waitFor(() => {
        expect(vi.mocked(connectDebugGateway)).toHaveBeenCalled();
      });

      process.emit('SIGINT');
      await vi.waitFor(() => {
        expect(closeMock).toHaveBeenCalledTimes(1);
      });
      expect(exitSpy).not.toHaveBeenCalled();

      process.emit('SIGINT');
      await vi.waitFor(() => {
        expect(closeMock).toHaveBeenCalledTimes(2);
        expect(exitSpy).toHaveBeenCalledWith(130);
      });

      resolveClosed?.();
      await runPromise;
    } finally {
      restorePropertyDescriptor(process.stdin, 'isTTY', stdinIsTTY);
      restorePropertyDescriptor(process.stdout, 'isTTY', stdoutIsTTY);
    }
  });

  it('非交互式 dev 收到 SIGINT 应先关闭远程调试通道，第二次应强制退出', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );
    const closeMock = vi.fn();
    let resolveClosed: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: makeConnectedSession(options),
      close: closeMock,
      closed,
      updateTargets: vi.fn()
    }));

    const runPromise = run([
      process.execPath,
      'cli',
      'dev',
      GETTIME_TOOL_DIR,
      '--connect',
      'https://fastgpt.example.com/debug/connect?connectionKey=t1',
      '--no-interactive'
    ]);

    await vi.waitFor(() => {
      expect(vi.mocked(connectDebugGateway)).toHaveBeenCalled();
    });

    process.emit('SIGINT');
    await vi.waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
    expect(exitSpy).not.toHaveBeenCalled();

    process.emit('SIGINT');
    await vi.waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(2);
      expect(exitSpy).toHaveBeenCalledWith(130);
    });

    resolveClosed?.();
    await runPromise;
  });

  it('非交互式 dev 收到 SIGTERM 应关闭远程调试通道', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              gatewayUrl: 'wss://gateway.example.com/connection-gateway/v1',
              transport: 'websocket',
              source: 'debug:tmbId:tmb-1',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000
            }
          })
        )
      )
    );
    const closeMock = vi.fn();
    let resolveClosed: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: makeConnectedSession(options),
      close: closeMock,
      closed,
      updateTargets: vi.fn()
    }));

    const runPromise = run([
      process.execPath,
      'cli',
      'dev',
      GETTIME_TOOL_DIR,
      '--connect',
      'https://fastgpt.example.com/debug/connect?connectionKey=t1',
      '--no-interactive'
    ]);

    await vi.waitFor(() => {
      expect(vi.mocked(connectDebugGateway)).toHaveBeenCalled();
    });

    process.emit('SIGTERM');
    await vi.waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
    expect(exitSpy).not.toHaveBeenCalled();

    resolveClosed?.();
    await runPromise;
  });

  it('非交互模式缺少 connection key 时应提示传入 --connect', async () => {
    await expect(
      run([process.execPath, 'cli', 'dev', GETTIME_TOOL_DIR, '--no-interactive'])
    ).rejects.toThrow('dev 需要 --connect');
  });
});

function getLoggerOutput(mockFn: ReturnType<typeof vi.fn>): string {
  return mockFn.mock.calls
    .map(([message]) => (typeof message === 'string' ? message : JSON.stringify(message)))
    .join('\n');
}

function restorePropertyDescriptor(
  target: object,
  property: string,
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
    return;
  }

  Reflect.deleteProperty(target, property);
}

function makeConnectedSession(options: {
  userId: string;
  source?: string;
}) {
  return {
    id: 'session-debug',
    consumerType: 'plugin-debug',
    subject: `user:${options.userId}`,
    sessionScope: {
      userId: options.userId,
      source: options.source
    },
    transport: 'websocket' as const,
    capabilities: ['gateway.bind', 'invoke'],
    generation: 0,
    ownerNodeId: 'node-a',
    status: 'connected' as const,
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    expiresAt: Date.now() + 60_000
  };
}

async function createDebugPluginFixture({
  name,
  description,
  toolDescription
}: {
  name: Record<string, string>;
  description: string | Record<string, string>;
  toolDescription: string | Record<string, string>;
}): Promise<string> {
  const entryDir = await mkdtemp(path.join(FIXTURE_ROOT, 'debug-i18n-'));
  const source = `
import { createToolHandler, defineTool } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const handler = createToolHandler({
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  handler: async () => ({})
});

export default defineTool({
  manifest: {
    pluginId: 'debug-i18n-fixture',
    name: ${JSON.stringify(name)},
    description: ${JSON.stringify(description)},
    toolDescription: ${JSON.stringify(toolDescription)},
    version: '1.0.0'
  },
  handler
});
`;
  await writeFile(path.join(entryDir, 'index.ts'), source);
  return entryDir;
}

async function copyDebugFixture(sourceDir: string, targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name !== '__pack_output__')
      .map((entry) =>
        cp(path.join(sourceDir, entry.name), path.join(targetDir, entry.name), {
          recursive: true
        })
      )
  );
}
