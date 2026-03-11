import type { Command } from 'commander';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { ZipFile } from 'yazl';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { logger } from '@fastgpt-plugin/cli/helpers';

interface PackCommandOptions {
  entry: string;
  dist: string;
  output?: string;
  name?: string;
}

/**
 * .pkg 文件结构：
 *   index.js          ← dist/index.js（必须）
 *   config.json       ← dist/config.json（可选）
 *   manifest.yaml     ← entry/manifest.yaml（必须）
 *   logo.*            ← entry/logo.*（可选，取第一个匹配）
 *   README.md         ← entry/README.md（可选）
 *   assets/           ← entry/assets/（可选）
 *   children/<name>/logo.*  ← 工具集子工具 logo（可选）
 */
export class PackCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('pack')
      .description('将 FastGPT 工具或工具集打包为 .pkg 文件')
      .option('-e, --entry <path>', '工具源码根目录', process.cwd())
      .option('-d, --dist <path>', '构建产物目录', './dist')
      .option('-o, --output <path>', '输出目录（默认使用入口目录）')
      .option('-n, --name <name>', '包名称（默认使用入口目录名）')
      .action(async (opts: PackCommandOptions) => {
        await this.run(opts);
      });
  }

  public async run(options: PackCommandOptions): Promise<void> {
    const start = Date.now();

    const entryDir = path.resolve(options.entry);
    const distDir = path.resolve(entryDir, options.dist);
    const outputDir = path.resolve(options.output || entryDir);
    const toolName = options.name || path.basename(entryDir);
    const pkgPath = path.join(outputDir, `${toolName}.pkg`);

    try {
      await assertPathExists(entryDir, `入口目录不存在: ${entryDir}`);
      await assertPathExists(distDir, `构建产物目录不存在: ${distDir}（请先运行 build）`);

      // 必须文件
      const distIndexPath = path.join(distDir, 'index.js');
      await assertPathExists(distIndexPath, `找不到 dist/index.js：${distIndexPath}`);

      const manifestPath = path.join(entryDir, 'manifest.yaml');
      await assertPathExists(manifestPath, `找不到 manifest.yaml：${manifestPath}`);

      await ensureDir(outputDir);

      const zipFile = new ZipFile();
      const outStream = createWriteStream(pkgPath);
      const zipPromise = new Promise<void>((resolve, reject) => {
        zipFile.outputStream.pipe(outStream).on('close', () => resolve());
        zipFile.outputStream.on('error', (err) => reject(err));
        outStream.on('error', (err) => reject(err));
      });

      // ── dist 产物 ──────────────────────────────────────────────────────────
      zipFile.addFile(distIndexPath, 'index.js');

      const distConfigPath = path.join(distDir, 'config.json');
      if (await pathExists(distConfigPath)) {
        zipFile.addFile(distConfigPath, 'config.json');
      }

      // ── 源码根目录的静态文件 ────────────────────────────────────────────────
      zipFile.addFile(manifestPath, 'manifest.yaml');

      const logoFile = await findLogoFile(entryDir);
      if (logoFile) {
        zipFile.addFile(logoFile, path.basename(logoFile));
      }

      const readmePath = path.join(entryDir, 'README.md');
      if (await pathExists(readmePath)) {
        zipFile.addFile(readmePath, 'README.md');
      }

      // ── assets 目录 ────────────────────────────────────────────────────────
      const assetsDir = path.join(entryDir, 'assets');
      if (await pathExists(assetsDir)) {
        await addDirectoryToZip(zipFile, assetsDir, 'assets');
      }

      // ── 工具集：子工具 logo ─────────────────────────────────────────────────
      const childrenDir = path.join(entryDir, 'children');
      if (await pathExists(childrenDir)) {
        const children = await fs.readdir(childrenDir, { withFileTypes: true });
        for (const child of children) {
          if (!child.isDirectory()) continue;
          const childDir = path.join(childrenDir, child.name);
          const childLogo = await findLogoFile(childDir);
          if (childLogo) {
            const zipEntry = `children/${child.name}/${path.basename(childLogo)}`;
            zipFile.addFile(childLogo, zipEntry);
          }
        }
      }

      zipFile.end();
      await zipPromise;

      const duration = ((Date.now() - start) / 1000).toFixed(2);
      logger.success(`打包完成，用时 ${duration}s`);
      logger.info(`输出文件: ${pkgPath}`);
    } catch (error) {
      logger.error('打包失败，详情如下:');
      logger.error(error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }
}

/** 在目录中找第一个 logo.* 文件，返回完整路径或 null */
async function findLogoFile(dir: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const logo = entries.find(
      (e) => e.isFile() && /^logo\./i.test(e.name)
    );
    return logo ? path.join(dir, logo.name) : null;
  } catch {
    return null;
  }
}

async function addDirectoryToZip(zipFile: ZipFile, dir: string, rootInZip: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = `${rootInZip}/${entry.name}`;

    if (entry.isDirectory()) {
      await addDirectoryToZip(zipFile, fullPath, relPath);
    } else if (entry.isFile()) {
      zipFile.addFile(fullPath, relPath);
    }
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
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
