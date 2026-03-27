import { mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '@fastgpt-plugin/cli/cmd';
import { logger } from '@fastgpt-plugin/cli/helpers';

const FIXTURE_ROOT = path.join(__dirname, '../../test/fixtures');
const DBOPS_SUITE_DIR = path.join(FIXTURE_ROOT, 'tool-suites', 'dbops');
const GETTIME_TOOL_DIR = path.join(FIXTURE_ROOT, 'tools', 'getTime');

describe('pack command', () => {
  const loggerSpy = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);

    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    loggerSpy.success.mockReset();
    loggerSpy.info.mockReset();
    loggerSpy.error.mockReset();
  });

  it('应能使用 fixtures 中的 getTime 单工具进行打包', async () => {
    const outputDir = path.join(GETTIME_TOOL_DIR, '__pack_output__');
    const pkgName = 'getTime';

    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
      // ignore
    }

    await mkdir(outputDir, { recursive: true });

    await run([
      process.execPath,
      'cli',
      'pack',
      '--entry',
      GETTIME_TOOL_DIR,
      '--output',
      outputDir,
      '--name',
      pkgName
    ]);

    const pkgPath = path.join(outputDir, `${pkgName}.pkg`);
    expect(existsSync(pkgPath)).toBe(true);

    const pkgStat = await stat(pkgPath);
    expect(pkgStat.size).toBeGreaterThan(0);

    expect(loggerSpy.success).toHaveBeenCalled();
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('应能使用 fixtures 中的 dbops 工具集进行打包', async () => {
    const outputDir = path.join(DBOPS_SUITE_DIR, '__pack_output__');
    const pkgName = 'dbops';

    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
      // ignore
    }

    await mkdir(outputDir, { recursive: true });

    await run([
      process.execPath,
      'cli',
      'pack',
      '--entry',
      DBOPS_SUITE_DIR,
      '--output',
      outputDir,
      '--name',
      pkgName
    ]);

    const pkgPath = path.join(outputDir, `${pkgName}.pkg`);
    expect(existsSync(pkgPath)).toBe(true);

    const pkgStat = await stat(pkgPath);
    expect(pkgStat.size).toBeGreaterThan(0);

    expect(loggerSpy.success).toHaveBeenCalled();
    expect(loggerSpy.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
