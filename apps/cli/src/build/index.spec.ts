import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

vi.mock('tsdown', () => ({
  build: vi.fn(async ({ outDir }: { outDir: string }) => {
    const { writeFile: write } = await import('node:fs/promises');
    await write(path.join(outDir, 'index.js'), 'export default globalThis.__fastgptPluginBuildTestTool;\n');
  })
}));

import { validateReadmeFileNames } from '../helpers/readme-files';

import { buildToolPackage } from './index';

type BuildTestGlobal = typeof globalThis & {
  __fastgptPluginBuildTestTool?: unknown;
};

const localizedMeta = (key: string) =>
  ({
    title: `Legacy ${key} title`,
    description: `Legacy ${key} description`,
    placeholder: `Legacy ${key} placeholder`,
    'x-i18n': {
      title: { en: `${key} title`, 'zh-CN': `${key} 标题` },
      description: { en: `${key} description`, 'zh-CN': `${key} 说明` },
      placeholder: { en: `${key} placeholder`, 'zh-CN': `${key} 占位符` }
    },
    toolDescription: { en: `${key} model hint`, 'zh-CN': `${key} 模型说明` }
  }) as z.GlobalMeta;

const createToolExport = () => {
  const inputSchema = z.object({
    query: z.string().meta(localizedMeta('Query')),
    legacy: z.string().meta({ title: 'Legacy-only title' }),
    nested: z.object({
      value: z.string().meta(localizedMeta('Nested'))
    }),
    nestedList: z.array(
      z.object({ label: z.string().meta(localizedMeta('Nested list')) })
    )
  });
  const outputSchema = z.object({
    result: z.string().meta(localizedMeta('Result'))
  });
  const secretSchema = z.object({
    apiKey: z.string().meta(localizedMeta('API key'))
  });

  return {
    getUserToolManifest: () => ({
      pluginId: 'i18n-build-test',
      version: '1.0.0',
      name: { en: 'I18n test', 'zh-CN': '国际化测试' },
      description: { en: 'A build test', 'zh-CN': '构建测试' },
      toolDescription: 'Use the tool',
      tags: ['tools']
    }),
    getSecretSchema: () => secretSchema,
    getToolHandler: () => ({ inputSchema, outputSchema }),
    getChildManifests: () => []
  };
};

describe('buildToolPackage', () => {
  let testDir: string;
  let entryDir: string;
  let outputDir: string;
  const testGlobal = globalThis as BuildTestGlobal;

  beforeEach(async () => {
    testDir = await mkdtemp(path.join(tmpdir(), 'fastgpt-plugin-build-'));
    entryDir = path.join(testDir, 'plugin');
    outputDir = path.join(entryDir, 'dist');
    await mkdir(entryDir, { recursive: true });
    await writeFile(path.join(entryDir, 'index.ts'), 'export default {} as const;\n', 'utf-8');
    await writeFile(path.join(entryDir, 'logo.svg'), '<svg></svg>', 'utf-8');
    testGlobal.__fastgptPluginBuildTestTool = createToolExport();
  });

  afterEach(async () => {
    delete testGlobal.__fastgptPluginBuildTestTool;
    await rm(testDir, { recursive: true, force: true });
  });

  it('keeps localized schema descriptions while removing legacy tool descriptions', async () => {
    await writeFile(path.join(entryDir, 'README.md'), '默认说明', 'utf-8');
    await buildToolPackage({ entry: entryDir, output: outputDir, minify: false, format: 'esm' });

    const manifest = JSON.parse(await readFile(path.join(outputDir, 'manifest.json'), 'utf-8'));
    const query = manifest.inputSchema.properties.query;

    expect(query.title).toBe('Query title');
    expect(query.description).toBe('Query description');
    expect(query.placeholder).toBe('Query placeholder');
    expect(query['x-i18n']).toEqual({
      title: { en: 'Query title', 'zh-CN': 'Query 标题' },
      description: { en: 'Query description', 'zh-CN': 'Query 说明' },
      placeholder: { en: 'Query placeholder', 'zh-CN': 'Query 占位符' }
    });
    expect(query).not.toHaveProperty('toolDescription');
    expect(manifest.description).toEqual({ en: 'A build test', 'zh-CN': '构建测试' });
    expect(manifest).not.toHaveProperty('toolDescription');
    expect(manifest.inputSchema.properties.legacy.title).toBe('Legacy-only title');
    expect(manifest.inputSchema.properties.nested.properties.value).not.toHaveProperty('toolDescription');
    expect(manifest.inputSchema.properties.nestedList.items.properties.label).not.toHaveProperty('toolDescription');
    expect(manifest.outputSchema.properties.result.description).toBe('Result 说明');
    expect(manifest.outputSchema.properties.result).not.toHaveProperty('toolDescription');
    expect(manifest.secretSchema.properties.apiKey.placeholder).toBe('API key 占位符');
    expect(manifest.secretSchema.properties.apiKey).not.toHaveProperty('toolDescription');
  });

  it('removes legacy root and child descriptions from built toolset manifests', async () => {
    const rootTool = createToolExport();
    const childDescription = { en: 'Search child', 'zh-CN': '搜索子工具' };
    testGlobal.__fastgptPluginBuildTestTool = {
      ...rootTool,
      getChildManifests: () => [
        {
          id: 'search',
          name: { en: 'Search', 'zh-CN': '搜索' },
          description: childDescription,
          toolDescription: 'Legacy child description'
        }
      ]
    };

    await buildToolPackage({ entry: entryDir, output: outputDir, minify: false, format: 'esm' });

    const manifest = JSON.parse(await readFile(path.join(outputDir, 'manifest.json'), 'utf-8'));
    expect(manifest.description).toEqual({ en: 'A build test', 'zh-CN': '构建测试' });
    expect(manifest).not.toHaveProperty('toolDescription');
    expect(manifest.children[0].description).toEqual(childDescription);
    expect(manifest.children[0]).not.toHaveProperty('toolDescription');
    expect(manifest.children[0].inputSchema.properties.query).not.toHaveProperty('toolDescription');
  });

  it('copies every supported README variant and rejects unsupported or duplicate locales', async () => {
    await Promise.all(
      [
        ['README.en.md', 'English'],
        ['README.zh-CN.md', '简体中文'],
        ['README.zh-Hant.md', '繁體中文']
      ].map(([name, contents]) => writeFile(path.join(entryDir, name), contents, 'utf-8'))
    );

    await buildToolPackage({ entry: entryDir, output: outputDir, minify: false, format: 'esm' });

    await expect(readFile(path.join(outputDir, 'README.en.md'), 'utf-8')).resolves.toBe('English');
    await expect(readFile(path.join(outputDir, 'README.zh-CN.md'), 'utf-8')).resolves.toBe('简体中文');
    await expect(readFile(path.join(outputDir, 'README.zh-Hant.md'), 'utf-8')).resolves.toBe('繁體中文');
  });

  it('rejects invalid README locale filenames before producing a package', async () => {
    await writeFile(path.join(entryDir, 'README.fr.md'), 'Unsupported language', 'utf-8');

    await expect(
      buildToolPackage({ entry: entryDir, output: outputDir, minify: false, format: 'esm' })
    ).rejects.toThrow(/README\.fr\.md/);
  });

  it('rejects duplicate locale entries and non-canonical casing', () => {
    expect(() => validateReadmeFileNames(['README.en.md', 'README.en.md'])).toThrow(
      /Duplicate README locale "en"/
    );
    expect(() => validateReadmeFileNames(['README.zh-cn.md'])).toThrow(/Invalid README filename/);
  });

});
