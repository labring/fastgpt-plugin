import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { computeSingleToolEtag, computeToolSuiteEtag } from './etag';

const SNAPSHOT_ROOT = join(process.cwd(), '__build_snapshot__', 'etag');

async function ensureCleanDir(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  await fs.mkdir(dir, { recursive: true });
}

function md5(input: string | Buffer): string {
  const hash = createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}

describe('etag helpers', () => {
  beforeEach(async () => {
    await ensureCleanDir(SNAPSHOT_ROOT);
  });

  it('computeSingleToolEtag should hash only src files and ignore tests', async () => {
    const rootDir = join(SNAPSHOT_ROOT, 'single');
    const srcDir = join(rootDir, 'src');
    const testsDir = join(srcDir, '__tests__');

    await fs.mkdir(testsDir, { recursive: true });

    // 正常源码文件
    const aPath = join(srcDir, 'a.ts');
    const bPath = join(srcDir, 'nested', 'b.ts');
    await fs.mkdir(join(srcDir, 'nested'), { recursive: true });
    await fs.writeFile(aPath, 'console.log("a");', 'utf-8');
    await fs.writeFile(bPath, 'console.log("b");', 'utf-8');

    // 测试文件，应该被忽略
    await fs.writeFile(join(testsDir, 'ignored.ts'), 'console.log("ignored");', 'utf-8');
    await fs.writeFile(join(srcDir, 'c.test.ts'), 'console.log("test");', 'utf-8');
    await fs.writeFile(join(srcDir, 'd.spec.ts'), 'console.log("spec");', 'utf-8');

    const etag = await computeSingleToolEtag({ rootDir });

    // 手动计算预期值：只包含 a.ts 和 nested/b.ts
    const files = [
      'src/a.ts',
      'src/nested/b.ts' // 注意：先排序，再拼接
    ].sort();

    let aggregate = '';
    for (const rel of files) {
      const abs = join(rootDir, rel);
      const content = await fs.readFile(abs);
      const fileHash = md5(content);
      aggregate += `${rel}:${fileHash}\n`;
    }

    const expected = md5(aggregate);
    expect(etag).toBe(expected);
  });

  it('computeToolSuiteEtag should aggregate child tool etags in order', async () => {
    const rootDir = join(SNAPSHOT_ROOT, 'suite');
    const childrenDir = join(rootDir, 'children');

    const alphaSrc = join(childrenDir, 'alpha', 'src');
    const betaSrc = join(childrenDir, 'beta', 'src');

    await fs.mkdir(alphaSrc, { recursive: true });
    await fs.mkdir(betaSrc, { recursive: true });

    await fs.writeFile(join(alphaSrc, 'index.ts'), 'console.log("alpha");', 'utf-8');
    await fs.writeFile(join(betaSrc, 'index.ts'), 'console.log("beta");', 'utf-8');

    const childNames = ['beta', 'alpha'];
    const toolId = 'suiteTool';

    const suiteEtag = await computeToolSuiteEtag({
      rootDir,
      toolId,
      children: childNames
    });

    // 手动计算：内部会对 children 名称排序后拼接
    const sortedChildren = [...childNames].sort();
    const lines: string[] = [];

    for (const child of sortedChildren) {
      const childRoot = join(rootDir, 'children', child);
      const childEtag = await computeSingleToolEtag({ rootDir: childRoot });
      lines.push(`${toolId}/${child}:${childEtag}`);
    }

    const aggregate = lines.length > 0 ? `${lines.join('\n')}\n` : '';
    const expected = md5(aggregate);

    expect(suiteEtag).toBe(expected);
  });
});
