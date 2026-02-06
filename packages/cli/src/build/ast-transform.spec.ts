import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { transformToolConfig } from './ast-transform';
import { computeSingleToolEtag, computeToolSuiteEtag } from './etag';

const FIXTURE_ROOT = join(__dirname, '../../test/fixtures');

function getFixtureToolDirs(subdir: 'tools' | 'tool-suites'): string[] {
  const root = join(FIXTURE_ROOT, subdir);
  return readdirSync(root)
    .map((name) => join(root, name))
    .filter((p) => statSync(p).isDirectory());
}

describe('ast-transform (fixtures)', () => {
  it('should inject toolId for all single tools fixtures', async () => {
    const toolDirs = getFixtureToolDirs('tools');

    // 当前只存在 getTime，一个一个校验即可
    for (const dir of toolDirs) {
      const configPath = join(dir, 'config.ts');
      const sourceCode = await readFile(configPath, 'utf-8');

      const result = await transformToolConfig({
        sourceCode,
        filePath: configPath
      });

      const toolName = dir.split('/').at(-1);
      expect(result.code).toMatch(new RegExp(`toolId\\s*:\\s*["']${toolName}["']`));

      const expectedEtag = await computeSingleToolEtag({ rootDir: dir });
      expect(result.code).toMatch(new RegExp(`etag\\s*:\\s*["']${expectedEtag}["']`));
    }
  });

  it('should inject toolId and children for all tool-suite fixtures', async () => {
    const suiteDirs = getFixtureToolDirs('tool-suites');

    for (const dir of suiteDirs) {
      const configPath = join(dir, 'config.ts');
      const sourceCode = await readFile(configPath, 'utf-8');

      const result = await transformToolConfig({
        sourceCode,
        filePath: configPath
      });

      const suiteName = dir.split('/').at(-1);
      expect(result.code).toMatch(new RegExp(`toolId\\s*:\\s*["']${suiteName}["']`));

      // tool-suites 应该自动注入 children 列表
      expect(result.code).toContain('children');

      const childrenRoot = join(dir, 'children');
      const children = readdirSync(childrenRoot)
        .map((name) => join(childrenRoot, name))
        .filter((p) => statSync(p).isDirectory())
        .map((p) => p.split('/').at(-1) as string);

      const expectedSuiteEtag = await computeToolSuiteEtag({
        rootDir: dir,
        toolId: suiteName || '',
        children
      });
      expect(result.code).toMatch(new RegExp(`etag\\s*:\\s*["']${expectedSuiteEtag}["']`));
    }
  });
});
