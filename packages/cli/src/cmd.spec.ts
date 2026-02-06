import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from './cmd.js';
import { CLI_NAME, CLI_VERSION } from './constants.js';

describe('cmd', () => {
  const consoleSpy = { log: vi.fn(), error: vi.fn() };
  let stdoutWrite: typeof process.stdout.write;

  beforeEach(() => {
    vi.stubGlobal('console', consoleSpy);
    stdoutWrite = process.stdout.write;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('run', () => {
    it('应能解析 --version 并输出版本到 stdout', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const out: string[] = [];
      process.stdout.write = vi.fn((chunk: string) => {
        out.push(chunk);
        return true;
      }) as typeof process.stdout.write;
      run([process.execPath, 'cli', '--version']);
      expect(out.join('').trim()).toBe(CLI_VERSION);
      exitSpy.mockRestore();
      process.stdout.write = stdoutWrite;
    });

    it('应能解析 -V 并输出版本', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const out: string[] = [];
      process.stdout.write = vi.fn((chunk: string) => {
        out.push(chunk);
        return true;
      }) as typeof process.stdout.write;
      run([process.execPath, 'cli', '-V']);
      expect(out.join('').trim()).toBe(CLI_VERSION);
      exitSpy.mockRestore();
      process.stdout.write = stdoutWrite;
    });

    it('无参数时应不抛错（显示 help）', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      expect(() => run([process.execPath, 'cli'])).not.toThrow();
      exitSpy.mockRestore();
    });
  });
});

describe('constants', () => {
  it('CLI_NAME 应为包名', () => {
    expect(CLI_NAME).toBe('@fastgpt-plugin/cli');
  });

  it('CLI_VERSION 应为语义化版本', () => {
    expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+(-(alpha|beta)\.\d+)?$/);
  });
});
