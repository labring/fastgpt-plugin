import type { Command } from 'commander';
import { logger } from '@fastgpt-plugin/cli/helpers';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { checkBuildOutput, type CheckOptions } from '@fastgpt-plugin/cli/check';

export class CheckCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('check')
      .description('检查构建产物的正确性（manifest.yaml、config.json、index.js）')
      .option('-e, --entry <path>', '工具源码目录', process.cwd())
      .option('-o, --output <path>', '构建输出目录', './dist')
      .action(async (opts: CheckOptions) => {
        await this.run(opts);
      });
  }

  public async run(options: CheckOptions): Promise<void> {
    logger.info(`检查目录: ${options.entry}`);
    logger.info(`产物目录: ${options.output}`);

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
