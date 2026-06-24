import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDebugGateway } from '@fastgpt-plugin/cli/debug/gateway';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../cmd';
import { logger } from '../helpers';

const { connectDebugGatewayMock } = vi.hoisted(() => ({
  connectDebugGatewayMock: vi.fn()
}));

vi.mock('@fastgpt-plugin/cli/debug/gateway', () => ({
  connectDebugGateway: connectDebugGatewayMock
}));

const FIXTURE_ROOT = fileURLToPath(new URL('../../../../test/fixtures/', import.meta.url));
const GETTIME_TOOL_DIR = path.join(FIXTURE_ROOT, 'tools', 'getTime');
const DBOPS_SUITE_DIR = path.join(FIXTURE_ROOT, 'tool-suites', 'dbops');
const UPLOAD_FILE_TOOL_DIR = path.join(FIXTURE_ROOT, 'tools', 'uploadFileEcho');

describe('debug command', () => {
  const loggerSpy = {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  };
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let tempUploadDir: string;

  beforeEach(async () => {
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
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
    vi.unstubAllGlobals();
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

  it('应能连接 Connection Gateway 等待远程调试请求', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1',
      '--gateway-source',
      'debug:user:u1'
    ]);

    const successOutput = getLoggerOutput(loggerSpy.success);

    expect(successOutput).toContain('远程调试已就绪: debug:user:u1 getTime');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能通过 tcp URL 连接 Connection Gateway', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1',
      '--gateway-tcp-url',
      'tcp://tcp.example.com:39430'
    ]);

    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      tcpHost: 'tcp.example.com',
      tcpPort: 39430
    });
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
      'https://fastgpt.example.com/debug/connect?ticket=t1'
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://fastgpt.example.com/debug/connect?ticket=t1'
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
  });

  it('应能通过 CONNECTION_GATEWAY_AUTH_TOKEN 配置 gateway token', async () => {
    process.env.CONNECTION_GATEWAY_AUTH_TOKEN = 'gateway-token-from-env';

    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1'
    ]);

    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      authToken: 'gateway-token-from-env'
    });
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('默认开启 Connection Gateway 自动重连', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1'
    ]);

    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      reconnect: true,
      reconnectIntervalMs: 2000
    });
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能关闭 Connection Gateway 自动重连', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1',
      '--gateway-no-reconnect'
    ]);

    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].options).toMatchObject({
      reconnect: false
    });
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能在一个 CLI 进程内为多个插件建立远程调试通道', async () => {
    await run([
      process.execPath,
      'cli',
      'debug',
      GETTIME_TOOL_DIR,
      DBOPS_SUITE_DIR,
      '--gateway',
      '--gateway-user-id',
      'u1'
    ]);

    const successOutput = getLoggerOutput(loggerSpy.success);
    const infoOutput = getLoggerOutput(loggerSpy.info);

    expect(vi.mocked(connectDebugGateway)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(connectDebugGateway).mock.calls[0]?.[0].targets).toHaveLength(2);
    expect(successOutput).toContain('远程调试已就绪: debug:user:u1 getTime');
    expect(successOutput).toContain('远程调试已就绪: debug:user:u1 dbops');
    expect(infoOutput).toContain('已建立 1 个远程调试通道，挂载 2 个插件');
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

function getLoggerOutput(mockFn: ReturnType<typeof vi.fn>): string {
  return mockFn.mock.calls
    .map(([message]) => (typeof message === 'string' ? message : JSON.stringify(message)))
    .join('\n');
}
