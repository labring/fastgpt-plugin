import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { buildToolPackage } from '@fastgpt-plugin/cli/build';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { formatCliError, logger } from '@fastgpt-plugin/cli/helpers';
import type { Command } from 'commander';
import { ZipFile } from 'yazl';

interface PackCommandOptions {
  entry: string;
  dist: string;
  output?: string;
  name?: string;
  verbose?: boolean;
}

/**
 * `.pkg` 文件结构：
 *   index.js
 *   manifest.json
 *   *.logo.*
 *   README.md（可选）
 *   assets/**（可选）
 */
export class PackCommand extends BaseCommand {
  public register(parent: Command): void {
    const command = this.addCommonOptions(
      parent
        .command('pack')
        .description('Pack a FastGPT plugin into .pkg / 打包 FastGPT 插件')
        .option('-e, --entry <path>', '插件源码目录 / Plugin source directory', process.cwd())
        .option('-d, --dist <path>', '构建产物目录 / Build output directory', './dist')
        .option('-o, --output <path>', 'pkg 输出目录 / .pkg output directory')
        .option('-n, --name <name>', '包名称 / Package name')
    );

    command.action(async (opts: PackCommandOptions) => {
      await this.run(opts);
    });
  }

  public async run(options: PackCommandOptions): Promise<void> {
    const start = Date.now();

    const entryDir = path.resolve(options.entry);
    const distDir = path.resolve(entryDir, options.dist);
    const outputDir = path.resolve(options.output || entryDir);
    const packageName = options.name || path.basename(entryDir);
    const pkgPath = path.join(outputDir, `${packageName}.pkg`);

    try {
      await buildToolPackage({
        entry: entryDir,
        output: distDir,
        minify: false,
        format: 'esm'
      });

      await ensureDir(outputDir);
      await zipDirectory(distDir, pkgPath);

      const duration = ((Date.now() - start) / 1000).toFixed(2);
      logger.success(`打包完成，用时 ${duration}s`);
      logger.info(`输出文件: ${pkgPath}`);
    } catch (error) {
      logger.error('打包失败，详情如下:');
      logger.error(formatCliError(error, options.verbose));
      process.exit(1);
    }
  }
}

async function zipDirectory(sourceDir: string, pkgPath: string): Promise<void> {
  const zipFile = new ZipFile();
  const outStream = createWriteStream(pkgPath);

  const zipPromise = new Promise<void>((resolve, reject) => {
    zipFile.outputStream.pipe(outStream).on('close', () => resolve());
    zipFile.outputStream.on('error', (err) => reject(err));
    outStream.on('error', (err) => reject(err));
  });

  const files = await collectFiles(sourceDir);
  const normalizedPkgPath = path.resolve(pkgPath);

  for (const file of files) {
    if (path.resolve(file.absolutePath) === normalizedPkgPath) {
      continue;
    }

    zipFile.addFile(file.absolutePath, file.relativePath);
  }

  zipFile.end();
  await zipPromise;
}

async function collectFiles(
  dir: string,
  baseDir: string = dir
): Promise<Array<{ absolutePath: string; relativePath: string }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: Array<{ absolutePath: string; relativePath: string }> = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, baseDir)));
      continue;
    }

    if (entry.isFile()) {
      files.push({
        absolutePath,
        relativePath: path.relative(baseDir, absolutePath)
      });
    }
  }

  return files;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
