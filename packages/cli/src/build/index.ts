import fs from 'node:fs/promises';
import path from 'node:path';
import { build as tsdownBuild } from 'tsdown';
import { transformToolConfig } from '@fastgpt-plugin/cli/build/ast-transform';
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
 */
export async function buildToolPackage(options: ToolBuildOptions): Promise<ToolBuildResult> {
  const entryDir = path.resolve(options.entry);

  // 1. 检查入口目录是否存在
  await assertPathExists(entryDir, `入口目录不存在: ${entryDir}`);

  // 2. 检查是否有 config.ts 文件
  const configPath = path.join(entryDir, 'config.ts');
  await assertPathExists(configPath, `找不到 config.ts 文件: ${configPath}`);

  // 3. 检查是否有 index.ts 文件
  const indexPath = path.join(entryDir, 'index.ts');
  await assertPathExists(indexPath, `找不到 index.ts 文件: ${indexPath}`);

  // 4. 创建临时构建目录
  const tempDir = path.join(entryDir, '.build-temp');
  await ensureDir(tempDir);

  const tStart = Date.now();
  let tConfig = 0;
  let tCopy = 0;
  let tBuild = 0;

  try {
    // 5. 转换 config.ts 并写入临时目录
    const tConfigStart = Date.now();
    const configContent = await fs.readFile(configPath, 'utf-8');
    const transformed = await transformToolConfig({
      sourceCode: configContent,
      filePath: configPath
    });
    await fs.writeFile(path.join(tempDir, 'config.ts'), transformed.code, 'utf-8');
    tConfig = Date.now() - tConfigStart;

    // 6. 复制其他必要文件到临时目录
    const tCopyStart = Date.now();
    await copySourceFiles(entryDir, tempDir, entryDir);
    tCopy = Date.now() - tCopyStart;

    // 7. 准备输出目录
    const outputDir = path.resolve(options.output);
    await ensureDir(outputDir);

    // 8. 使用 tsdown 构建临时目录
    const tempIndexPath = path.join(tempDir, 'index.ts');

    const tBuildStart = Date.now();
    await tsdownBuild({
      entry: [tempIndexPath],
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

    const files = await fs.readdir(outputDir);

    const tTotal = Date.now() - tStart;

    logger.info(
      [
        '构建阶段耗时统计：',
        `• config 转换: ${formatDuration(tConfig)}`,
        `• 源码复制:    ${formatDuration(tCopy)}`,
        `• tsdown 构建: ${formatDuration(tBuild)}`,
        `• 总耗时:      ${formatDuration(tTotal)}`
      ].join('\n')
    );

    return {
      entryDir,
      outputDir,
      files: files.map((f) => f)
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // noop
    }
  }
}

/**
 * 从入口目录复制源码到临时目录：
 * - 根目录的 config.ts 已被转换，不再复制
 * - 子目录中的 config.ts 需要保留（子工具自身的配置）
 */
async function copySourceFiles(
  sourceDir: string,
  targetDir: string,
  rootDir: string
): Promise<void> {
  const files = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const file of files) {
    // Skip node_modules, dist, and build temp directories
    if (file.name === 'node_modules' || file.name === 'dist' || file.name.startsWith('.build-')) {
      continue;
    }

    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      await ensureDir(targetPath);
      await copySourceFiles(sourcePath, targetPath, rootDir);
    } else if (file.isFile()) {
      const isRootConfig = file.name === 'config.ts' && sourceDir === rootDir;

      // 根目录的 config.ts 已经在前面被 AST 转换并写入临时目录，这里跳过；
      // 子目录中的 config.ts 需要继续注入 toolId（特别是 children 子工具），
      // 因此这里对它们再次应用 transformToolConfig。
      if (!isRootConfig) {
        if (file.name === 'config.ts') {
          const configContent = await fs.readFile(sourcePath, 'utf-8');
          const transformed = await transformToolConfig({
            sourceCode: configContent,
            filePath: sourcePath
          });
          await fs.writeFile(targetPath, transformed.code, 'utf-8');
        } else {
          await fs.copyFile(sourcePath, targetPath);
        }
      }
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
  const sec = ms / 1000;
  return `${sec.toFixed(2)}s`;
}
