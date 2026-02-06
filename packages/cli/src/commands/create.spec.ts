import { mkdir, readdir, readFile, rm } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '@fastgpt-plugin/cli/cmd';
import { logger } from '@fastgpt-plugin/cli/helpers';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-plugin'),
  select: vi.fn().mockResolvedValue('tool')
}));

describe('create command', () => {
  const loggerSpy = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
  let testCwd: string;

  beforeEach(async () => {
    vi.spyOn(logger, 'success').mockImplementation(loggerSpy.success);
    vi.spyOn(logger, 'info').mockImplementation(loggerSpy.info);
    vi.spyOn(logger, 'error').mockImplementation(loggerSpy.error);
    testCwd = path.join(tmpdir(), `fastgpt-plugin-create-${Date.now()}`);
    await mkdir(testCwd, { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await rm(testCwd, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function listCreatedFiles(projectName: string): Promise<string[]> {
    const dir = path.join(testCwd, projectName);
    const collect = async (p: string): Promise<string[]> => {
      const names = await readdir(p, { withFileTypes: true });
      const out: string[] = [];
      for (const n of names) {
        const full = path.join(p, n.name);
        const rel = path.relative(dir, full).replace(/\\/g, '/');
        if (n.isDirectory()) {
          out.push(...(await collect(full)));
        } else {
          out.push(rel);
        }
      }
      return out.sort();
    };
    return collect(dir);
  }

  it('应能执行 create 并输出默认 name 与 type', async () => {
    await run([process.execPath, 'cli', 'create', '--cwd', testCwd]);
    // 由于没有提供 name，会使用 mock 的 'test-plugin'
    expect(loggerSpy.success).toHaveBeenCalledWith('创建插件项目: test-plugin (tool)', {
      cwd: testCwd
    });
    const files = await listCreatedFiles('test-plugin');
    // 基础文件
    expect(files).toContain('config.ts');
    expect(files).toContain('package.json');
    expect(files).toContain('README.md');
    expect(files).toContain('vitest.config.ts');
    // 源码与测试结构
    expect(files).toContain('src/schemas.ts');
    expect(files).toContain('src/tool.ts');
    expect(files).toContain('src/tool.test.ts');
  });

  it('应将占位符替换为规范化后的 name 与 description', async () => {
    const rawName = 'My Awesome Tool';
    const normalizedName = 'my-awesome-tool';
    const description = 'My awesome description';

    await run([
      process.execPath,
      'cli',
      'create',
      rawName,
      '--type',
      'tool',
      '--description',
      description,
      '--cwd',
      testCwd
    ]);

    const projectDir = path.join(testCwd, rawName);
    const pkgJson = JSON.parse(await readFile(path.join(projectDir, 'package.json'), 'utf-8')) as {
      name: string;
      description: string;
    };
    const readme = await readFile(path.join(projectDir, 'README.md'), 'utf-8');

    expect(pkgJson.name).toBe(normalizedName);
    expect(pkgJson.description).toBe(description);
    expect(readme).toContain(normalizedName);
    expect(readme).toContain(description);
  });

  it('应能解析 create <name> 与 --type', async () => {
    await run([
      process.execPath,
      'cli',
      'create',
      'my-tool',
      '--type',
      'tool-suite',
      '--description',
      'Test tool',
      '--cwd',
      testCwd
    ]);
    expect(loggerSpy.success).toHaveBeenLastCalledWith('创建插件项目: my-tool (tool-suite)', {
      cwd: testCwd
    });
    const files = await listCreatedFiles('my-tool');
    // 父级配置
    expect(files).toContain('config.ts');
    expect(files).toContain('package.json');
    expect(files).toContain('README.md');
    expect(files).toContain('vitest.config.ts');
    // 子工具结构
    expect(files).toContain('children/tool/config.ts');
    expect(files).toContain('children/tool/src/schemas.ts');
    expect(files).toContain('children/tool/src/tool.ts');
    expect(files).toContain('children/tool/src/tool.test.ts');
  });

  it('应能解析 --cwd', async () => {
    await run([
      process.execPath,
      'cli',
      'create',
      'foo',
      '--type',
      'single-tool',
      '--description',
      'Test',
      '--cwd',
      testCwd
    ]);
    expect(loggerSpy.success).toHaveBeenLastCalledWith('创建插件项目: foo (tool)', {
      cwd: testCwd
    });
    const files = await listCreatedFiles('foo');
    expect(files.length).toBeGreaterThan(0);
  });
});
