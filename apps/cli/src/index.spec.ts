import { afterEach, describe, expect, it, vi } from 'vitest';

const { runMock, loggerErrorMock } = vi.hoisted(() => ({
  runMock: vi.fn(),
  loggerErrorMock: vi.fn()
}));

vi.mock('@fastgpt-plugin/cli/cmd', () => ({
  run: runMock
}));

vi.mock('@fastgpt-plugin/cli/helpers', () => ({
  logger: {
    error: loggerErrorMock
  }
}));

describe('cli entry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    runMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it('不应在入口层拦截 SIGINT 强制退出，由具体命令处理清理', async () => {
    runMock.mockReturnValue(new Promise(() => undefined));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await import('./index.js');
    process.emit('SIGINT');

    expect(exitSpy).not.toHaveBeenCalled();
  });
});
