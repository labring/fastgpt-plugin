import path from 'node:path';

import { checkBuildOutput, type CheckOptions } from '@fastgpt-plugin/cli/check';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { logger } from '@fastgpt-plugin/cli/helpers';
import type { Command } from 'commander';

export class CheckCommand extends BaseCommand {
  public register(parent: Command): void {
    const command = this.addCommonOptions(
      parent
        .command('check')
        .description('Check plugin build output / 检查插件构建产物')
        .option('-e, --entry <path>', '插件源码目录 / Plugin source directory', process.cwd())
        .option('-o, --output <path>', '构建输出目录 / Build output directory', './dist')
    );

    command.action(async (opts: CheckOptions) => {
      await this.run(opts);
    });
  }

  public async run(options: CheckOptions): Promise<void> {
    const entryDir = path.resolve(options.entry);
    const outputDir = path.resolve(entryDir, options.output);

    logger.info(`检查目录: ${entryDir}`);
    logger.info(`产物目录: ${outputDir}`);

    const result = await checkBuildOutput(options);

    if (result.warnings.length > 0) {
      for (const w of result.warnings) {
        logger.warn(w);
      }
    }

    if (result.errors.length > 0) {
      logger.error(`检查失败，共 ${result.errors.length} 个错误：`);
      for (const e of result.errors) {
        logger.error(`  ✗ ${e}`);
      }
      process.exit(1);
    }

    logger.success('检查通过，构建产物格式正确');
  }
}
