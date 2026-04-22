import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../cmd';
import { logger } from '../helpers';

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
    tempUploadDir = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-debug-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    loggerSpy.success.mockReset();
    loggerSpy.info.mockReset();
    loggerSpy.error.mockReset();
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
});

function getLoggerOutput(mockFn: ReturnType<typeof vi.fn>): string {
  return mockFn.mock.calls
    .map(([message]) => (typeof message === 'string' ? message : JSON.stringify(message)))
    .join('\n');
}
