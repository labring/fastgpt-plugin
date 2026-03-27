import { describe, it, expect, vi } from 'vitest';
import { BuildCommand } from './build';
import { join } from 'node:path';
import { existsSync, rmSync, readdirSync, statSync } from 'node:fs';

const FIXTURE_ROOT = join(__dirname, '../../test/fixtures');
const SNAPSHOT_ROOT = join(process.cwd(), '__build_snapshot__');

function getFixtureToolDirs(subdir: 'tools' | 'tool-suites'): string[] {
  const root = join(FIXTURE_ROOT, subdir);
  return readdirSync(root)
    .map((name) => join(root, name))
    .filter((p) => statSync(p).isDirectory());
}

describe('BuildCommand with fixtures', () => {
  it('should exit with error when entry is invalid', async () => {
    const cmd = new BuildCommand();
    const spy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    await cmd.run({
      entry: join(__dirname, '__not_exists__'),
      output: join(__dirname, '__out__'),
      minify: false,
      watch: false,
      format: 'esm'
    });

    expect(spy).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });

  it('should build all single tools fixtures via CLI', async () => {
    const toolDirs = getFixtureToolDirs('tools');

    for (const dir of toolDirs) {
      const name = dir.split('/').at(-1);
      if (!name) continue;
      const outputDir = join(SNAPSHOT_ROOT, 'tools', name);

      if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true, force: true });
      }

      const cmd = new BuildCommand();
      const spy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await cmd.run({
        entry: dir,
        output: outputDir,
        minify: false,
        watch: false,
        format: 'esm'
      });

      expect(existsSync(outputDir)).toBe(true);

      spy.mockRestore();
    }
  });

  it('should build all tool-suite fixtures via CLI (no crash)', async () => {
    const suiteDirs = getFixtureToolDirs('tool-suites');

    for (const dir of suiteDirs) {
      const name = dir.split('/').at(-1);
      if (!name) continue;
      const outputDir = join(SNAPSHOT_ROOT, 'suites', name);

      if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true, force: true });
      }

      const cmd = new BuildCommand();
      const spy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await cmd.run({
        entry: dir,
        output: outputDir,
        minify: false,
        watch: false,
        format: 'esm'
      });

      expect(existsSync(outputDir)).toBe(true);

      spy.mockRestore();
    }
  });
});
