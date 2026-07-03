import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { run } from '@fastgpt-plugin/cli/cmd';
import { logger } from '@fastgpt-plugin/cli/helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURE_ROOT = path.join(__dirname, '../../../../test/fixtures');
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
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'fastgpt-pack-gettime-'));
    const entryDir = path.join(workspaceDir, 'getTime');
    const outputDir = path.join(workspaceDir, 'output');
    const pkgName = 'getTime';

    try {
      await preparePackFixture(GETTIME_TOOL_DIR, entryDir);

      await run([
        process.execPath,
        'cli',
        'pack',
        '--entry',
        entryDir,
        '--output',
        outputDir,
        '--name',
        pkgName
      ]);

      const pkgPath = path.join(outputDir, `${pkgName}.pkg`);
      expect(existsSync(pkgPath)).toBe(true);
      await expectSdkFactoryExternalized(entryDir);

      const pkgStat = await stat(pkgPath);
      expect(pkgStat.size).toBeGreaterThan(0);

      expect(loggerSpy.success).toHaveBeenCalled();
      expect(loggerSpy.error).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });

  it('应能使用 fixtures 中的 dbops 工具集进行打包', async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), 'fastgpt-pack-dbops-'));
    const entryDir = path.join(workspaceDir, 'dbops');
    const outputDir = path.join(workspaceDir, 'output');
    const pkgName = 'dbops';

    try {
      await preparePackFixture(DBOPS_SUITE_DIR, entryDir);

      await run([
        process.execPath,
        'cli',
        'pack',
        '--entry',
        entryDir,
        '--output',
        outputDir,
        '--name',
        pkgName
      ]);

      const pkgPath = path.join(outputDir, `${pkgName}.pkg`);
      expect(existsSync(pkgPath)).toBe(true);
      await expectSdkFactoryExternalized(entryDir);

      const pkgStat = await stat(pkgPath);
      expect(pkgStat.size).toBeGreaterThan(0);

      expect(loggerSpy.success).toHaveBeenCalled();
      expect(loggerSpy.error).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});

async function preparePackFixture(sourceDir: string, targetDir: string): Promise<void> {
  await cp(sourceDir, targetDir, {
    recursive: true,
    dereference: false,
    filter: (source) => {
      const relativePath = path.relative(sourceDir, source);
      return !relativePath.split(path.sep).some((part) => part === 'dist');
    }
  });
}

async function expectSdkFactoryExternalized(entryDir: string): Promise<void> {
  const distIndex = path.join(entryDir, 'dist/index.js');
  const source = await readFile(distIndex, 'utf-8');

  expect(source).toContain('@fastgpt-plugin/sdk-factory');
  expect(source).not.toContain('class ToolFactory');
}
