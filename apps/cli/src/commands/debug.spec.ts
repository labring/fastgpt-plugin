import { cp, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDebugGateway } from '@fastgpt-plugin/cli/debug/gateway';
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

  beforeEach(async () => {
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
    vi.spyOn(logger, 'warn').mockImplementation(loggerSpy.warn);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: {
        id: 'session-debug',
        consumerType: 'plugin-debug',
        subject: `user:${options.userId}`,
        sessionScope: {
          userId: options.userId,
          source: options.source
        },
        transport: 'tcp',
        capabilities: ['invoke'],
        generation: 0,
        ownerNodeId: 'node-a',
        status: 'connected',
        connectedAt: Date.now(),
        lastSeenAt: Date.now(),
        expiresAt: Date.now() + 60_000
      },
      close: vi.fn(),
      closed: Promise.resolve()
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
    await rm(tempUploadDir, { recursive: true, force: true });
  });

  it('应能输出单工具的本地调试信息和调用命令', async () => {
    await run([process.execPath, 'cli', 'debug', GETTIME_TOOL_DIR]);

    const output = getLoggerOutput(loggerSpy.info);

    expect(output).toContain('pluginId: getTime');
    expect(output).toContain('可调试工具');
    expect(output).toContain('fastgpt-plugin debug');
    expect(output).toContain('--run');
    expect(output).toContain('--input');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能输出工具集的子工具调试命令', async () => {
    await run([process.execPath, 'cli', 'debug', DBOPS_SUITE_DIR]);

    const output = getLoggerOutput(loggerSpy.info);

    expect(output).toContain('pluginId: dbops');
    expect(output).toContain('id: mysql');
    expect(output).toContain('id: pgsql');
    expect(output).toContain('--tool mysql');
    expect(output).toContain('--tool pgsql');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
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
              tcpUrl: 'tcp://tcp.example.com:39430',
              source: 'debug:tmbId:tmb-1:session:debug-1',
              sessionId: 'session-debug',
              connectToken: 'scoped-token',
              expiresAt: Date.now() + 60_000,
              session: {
                id: 'session-debug',
                consumerType: 'plugin-debug',
                subject: 'tmb-1',
                sessionScope: {
                  userId: 'tmb-1',
                  source: 'debug:tmbId:tmb-1:session:debug-1'
                },
                transport: 'tcp',
                capabilities: ['gateway.bind', 'invoke'],
                generation: 0,
                ownerNodeId: 'node-a',
                status: 'connecting',
                connectedAt: Date.now(),
                lastSeenAt: Date.now(),
                expiresAt: Date.now() + 60_000
              }
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
      'https://fastgpt.example.com/debug/connect?connectKey=t1'
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?connectKey=t1'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      tcpHost: 'tcp.example.com',
      tcpPort: 39430,
      source: 'debug:tmbId:tmb-1:session:debug-1',
      precreatedSession: {
        connectToken: 'scoped-token',
        session: expect.objectContaining({
          id: 'session-debug'
        })
      }
    });
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).not.toHaveProperty(
      'authToken'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).not.toHaveProperty(
      'jwtSecret'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1:session:debug-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.warn)).toContain('debug --connect 是兼容入口');
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

  beforeEach(async () => {
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
    vi.spyOn(logger, 'warn').mockImplementation(loggerSpy.warn);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.mocked(connectDebugGateway).mockImplementation(async ({ options }) => ({
      session: {
        id: 'session-debug',
        consumerType: 'plugin-debug',
        subject: `user:${options.userId}`,
        sessionScope: {
          userId: options.userId,
          source: options.source
        },
        transport: 'tcp',
        capabilities: ['invoke'],
        generation: 0,
        ownerNodeId: 'node-a',
        status: 'connected',
        connectedAt: Date.now(),
        lastSeenAt: Date.now(),
        expiresAt: Date.now() + 60_000
      },
      close: vi.fn(),
      closed: Promise.resolve()
    }));
    connectDebugGatewayMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    loggerSpy.success.mockReset();
    loggerSpy.info.mockReset();
    loggerSpy.error.mockReset();
    loggerSpy.warn.mockReset();
    vi.unstubAllGlobals();
    inputMock.mockReset();
    delete process.env.CONNECTION_GATEWAY_AUTH_TOKEN;
  });

  it('应能通过 dev --connect 启动集成开发会话', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              tcpUrl: 'tcp://tcp.example.com:39430',
              source: 'debug:tmbId:tmb-1:session:debug-1',
              sessionId: 'session-debug',
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
      'https://fastgpt.example.com/debug/connect?connectKey=t1',
      '--no-interactive'
    ]);

    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?connectKey=t1'
    );
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].targets).toHaveLength(2);
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      tcpHost: 'tcp.example.com',
      tcpPort: 39430,
      source: 'debug:tmbId:tmb-1:session:debug-1'
    });
    expect(infoOutput).toContain('FastGPT 插件开发会话');
    expect(infoOutput).toContain('command: fastgpt-plugin dev');
    expect(infoOutput).toContain('ui: plain');
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1:session:debug-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1:session:debug-1 dbops'
    );
    expect(loggerSpy.warn).not.toHaveBeenCalled();
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('dev 未指定插件目录时应自动发现当前目录下的插件', async () => {
    const workspaceDir = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-dev-discover-'));
    await cp(GETTIME_TOOL_DIR, path.join(workspaceDir, 'getTime'), {
      recursive: true
    });
    await cp(DBOPS_SUITE_DIR, path.join(workspaceDir, 'dbops'), {
      recursive: true
    });
    const previousCwd = process.cwd();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              tcpUrl: 'tcp://tcp.example.com:39430',
              source: 'debug:tmbId:tmb-1:session:debug-1',
              sessionId: 'session-debug',
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
        'https://fastgpt.example.com/debug/connect?connectKey=t1',
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
      '远程调试已就绪: debug:tmbId:tmb-1:session:debug-1 getTime'
    );
    expect(getLoggerOutput(loggerSpy.success)).toContain(
      '远程调试已就绪: debug:tmbId:tmb-1:session:debug-1 dbops'
    );
  });

  it('dev 未传 --connect 时应在交互式终端提示输入 connect link', async () => {
    inputMock.mockResolvedValue('https://fastgpt.example.com/debug/connect?connectKey=t1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              tcpUrl: 'tcp://tcp.example.com:39430',
              source: 'debug:tmbId:tmb-1:session:debug-1',
              sessionId: 'session-debug',
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
    } finally {
      restorePropertyDescriptor(process.stdin, 'isTTY', stdinIsTTY);
      restorePropertyDescriptor(process.stdout, 'isTTY', stdoutIsTTY);
    }

    expect(inputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'FastGPT connect link'
      })
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?connectKey=t1'
    );
  });

  it('非交互模式缺少 connect link 时应提示传入 --connect', async () => {
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
