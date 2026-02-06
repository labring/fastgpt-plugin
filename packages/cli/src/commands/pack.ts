import type { Command } from 'commander';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { ZipFile } from 'yazl';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { logger } from '@fastgpt-plugin/cli/helpers';

interface PackCommandOptions {
  entry: string;
  output?: string;
  name?: string;
}

export class PackCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('pack')
      .description('将 FastGPT 工具或工具集打包为 .pkg 文件')
      .option('-e, --entry <path>', '工具入口目录', process.cwd())
      .option('-o, --output <path>', '输出目录（默认使用入口目录）')
      .option('-n, --name <name>', '包名称（默认使用入口目录名）')
      .action(async (opts: PackCommandOptions) => {
        await this.run(opts);
      });
  }

  public async run(options: PackCommandOptions): Promise<void> {
    const start = Date.now();

    const entryDir = path.resolve(options.entry);
    const outputDir = path.resolve(options.output || entryDir);
    const toolName = options.name || path.basename(entryDir);
    const pkgPath = path.join(outputDir, `${toolName}.pkg`);

    try {
      await assertPathExists(entryDir, `入口目录不存在: ${entryDir}`);

      const distIndexPath = path.join(entryDir, 'dist', 'index.js');
      const logoPath = path.join(entryDir, 'logo.svg');
      const readmePath = path.join(entryDir, 'README.md');
      const assetsDir = path.join(entryDir, 'assets');
      const childrenDir = path.join(entryDir, 'children');

      await assertPathExists(distIndexPath, `找不到 dist/index.js 文件: ${distIndexPath}`);

      await ensureDir(outputDir);

      const zipFile = new ZipFile();
      const outStream = createWriteStream(pkgPath);

      const zipPromise = new Promise<void>((resolve, reject) => {
        zipFile.outputStream.pipe(outStream).on('close', () => resolve());
        zipFile.outputStream.on('error', (err) => reject(err));
        outStream.on('error', (err) => reject(err));
      });

      // 根文件（index.js 必须存在，logo.svg / README.md 为可选）
      zipFile.addFile(distIndexPath, 'index.js');

      if (await pathExists(logoPath)) {
        zipFile.addFile(logoPath, 'logo.svg');
      }

      if (await pathExists(readmePath)) {
        zipFile.addFile(readmePath, 'README.md');
      }

      // assets 目录（如果存在）
      if (await pathExists(assetsDir)) {
        await addDirectoryToZip(zipFile, assetsDir, 'assets');
      }

      // 工具集子工具 logo（如果存在 children 目录）
      if (await pathExists(childrenDir)) {
        const children = await fs.readdir(childrenDir, { withFileTypes: true });
        for (const child of children) {
          if (!child.isDirectory()) continue;
          const childName = child.name;
          const childDir = path.join(childrenDir, childName);
          const childLogoPath = path.join(childDir, 'logo.svg');

          zipFile.addEmptyDirectory(`${childName}/`);
          if (await pathExists(childLogoPath)) {
            zipFile.addFile(childLogoPath, `${childName}/logo.svg`);
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

async function addDirectoryToZip(zipFile: ZipFile, dir: string, rootInZip: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(rootInZip, entry.name).split(path.sep).join('/');

    if (entry.isDirectory()) {
      zipFile.addEmptyDirectory(`${relPath}/`);
      await addDirectoryToZip(zipFile, fullPath, relPath);
    } else if (entry.isFile()) {
      zipFile.addFile(fullPath, relPath);
    }
  }
}
