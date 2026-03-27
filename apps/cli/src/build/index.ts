import fs from 'node:fs/promises';
import path from 'node:path';
import { build as tsdownBuild } from 'tsdown';
import { logger } from '@fastgpt-plugin/cli/helpers';

export interface ToolBuildOptions {
  entry: string;
  output: string;
  minify: boolean;
  format: 'esm' | 'cjs';
}

export interface ToolBuildResult {
  entryDir: string;
  outputDir: string;
  files: string[];
}

/**
 * 核心构建逻辑：给定入口目录和输出目录，完成一次工具构建。
 * - 使用 logger 记录关键阶段和耗时
 * - 不调用 process.exit
 * - 失败时抛出 Error
 *
 * 输出：
 *   dist/index.js    ← 完整插件，给进程池 fork 用
 *   dist/config.json ← 工具 schema 的 JSON Schema，给 parse time 读取
 *     单工具:  { inputSchema: {}, outputSchema: {}, secretSchema?: {} }
 *     工具集:  { tool1: { inputSchema: {}, outputSchema: {}, secretSchema?: {} }, tool2: { ... } }
 */
export async function buildToolPackage(options: ToolBuildOptions): Promise<ToolBuildResult> {
  const entryDir = path.resolve(options.entry);

  // 1. 检查入口目录是否存在
  await assertPathExists(entryDir, `入口目录不存在: ${entryDir}`);

  // 2. 检查是否有 manifest.yaml 文件
  const manifestPath = path.join(entryDir, 'manifest.yaml');
  await assertPathExists(manifestPath, `找不到 manifest.yaml 文件: ${manifestPath}`);

  // 3. 检查是否有 index.ts 文件
  const indexPath = path.join(entryDir, 'index.ts');
  await assertPathExists(indexPath, `找不到 index.ts 文件: ${indexPath}`);

  // 4. 创建临时构建目录
  const tempDir = path.join(entryDir, '.build-temp');
  await ensureDir(tempDir);

  const tStart = Date.now();
  let tCopy = 0;
  let tBuild = 0;

  try {
    // 5. 复制源码到临时目录
    const tCopyStart = Date.now();
    await copySourceFiles(entryDir, tempDir);
    tCopy = Date.now() - tCopyStart;

    // 6. 准备输出目录
    const outputDir = path.resolve(options.output);
    await ensureDir(outputDir);

    // 7. 使用 tsdown 构建 index.ts → index.js（完整插件，含所有依赖）
    const tempIndexPath = path.join(tempDir, 'index.ts');

    const tBuildStart = Date.now();
    await tsdownBuild({
      entry: { index: tempIndexPath },
      outDir: outputDir,
      format: [options.format],
      clean: true,
      minify: options.minify,
      inlineOnly: false,
      nodeProtocol: true,
      platform: 'node',
      target: 'node22',
      dts: false,
      treeshake: true,
      noExternal: ['*'],
      outExtensions: () => ({ dts: '.d.ts', js: '.js' })
    });
    tBuild = Date.now() - tBuildStart;

    // 8. 从编译后的 index.js 中调用 plugin.toSchemas() 生成 config.json
    //    plugin 通过 registerTool 持有所有子工具的 schema，无需单独的 schemas 文件
    const indexJsPath = path.join(outputDir, 'index.js');
    await extractAndWriteConfig(indexJsPath, outputDir);

    const files = await fs.readdir(outputDir);
    const tTotal = Date.now() - tStart;

    logger.info(
      [
        '构建阶段耗时统计：',
        `• 源码复制:    ${formatDuration(tCopy)}`,
        `• tsdown 构建: ${formatDuration(tBuild)}`,
        `• 总耗时:      ${formatDuration(tTotal)}`
      ].join('\n')
    );

    return { entryDir, outputDir, files };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // noop
    }
  }
}

/**
 * 从编译后的 index.js 中导入 plugin，调用 plugin.toSchemas() 生成 config.json。
 *
 * plugin.toSchemas() 返回格式：
 *   单工具:  { inputSchema: {}, outputSchema: {} }
 *   工具集:  { tool1: { input: {}, output: {} }, ... }
 */
async function extractAndWriteConfig(indexJsPath: string, outputDir: string): Promise<void> {
  // 用时间戳绕过模块缓存，确保每次构建都能拿到最新产物
  const mod = await import(`${indexJsPath}?t=${Date.now()}`);

  const plugin = mod.plugin;
  if (!plugin || typeof plugin.getConfig !== 'function') {
    logger.warn('index.js 未导出 plugin 或 plugin 不包含 getConfig()，跳过 config.json 生成');
    return;
  }

  const config = plugin.getConfig() as Record<string, unknown>;
  if (Object.keys(config).length === 0) {
    logger.warn('plugin.getConfig() 返回空对象，跳过 config.json 生成');
    return;
  }

  const configJsonPath = path.join(outputDir, 'config.json');
  await fs.writeFile(configJsonPath, JSON.stringify(config, null, 2), 'utf-8');
}

async function copySourceFiles(sourceDir: string, targetDir: string): Promise<void> {
  const files = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const file of files) {
    if (file.name === 'node_modules' || file.name === 'dist' || file.name.startsWith('.build-')) {
      continue;
    }

    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      await ensureDir(targetPath);
      await copySourceFiles(sourcePath, targetPath);
    } else if (file.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function assertPathExists(p: string, message: string): Promise<void> {
  try {
    await fs.access(p);
  } catch {
    throw new Error(message);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
