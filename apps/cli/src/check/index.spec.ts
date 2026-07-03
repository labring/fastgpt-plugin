import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkBuildOutput } from './index';

describe('checkBuildOutput', () => {
  let testCwd: string;

  beforeEach(async () => {
    testCwd = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-check-'));
  });

  afterEach(async () => {
    await rm(testCwd, { recursive: true, force: true });
  });

  it('入口目录不存在时应优先报告 entry 错误', async () => {
    const missingEntry = path.join(testCwd, 'missing-plugin');

    const result = await checkBuildOutput({
      entry: missingEntry,
      output: './dist'
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(`入口目录不存在: ${missingEntry}`);
  });

  it('相对 output 应基于 entry 目录解析', async () => {
    const entryDir = path.join(testCwd, 'plugin');
    await mkdir(entryDir, { recursive: true });
    await writeFile(path.join(entryDir, 'index.ts'), 'export default {};\n', 'utf-8');

    const result = await checkBuildOutput({
      entry: entryDir,
      output: './dist'
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      `构建产物目录不存在: ${path.join(entryDir, 'dist')}。请先运行 pnpm run build，或使用 --output 指向 dist 目录。`
    ]);
  });
});
