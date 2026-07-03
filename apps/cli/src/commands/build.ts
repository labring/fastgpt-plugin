import { buildToolPackage, type ToolBuildOptions } from '@fastgpt-plugin/cli/build';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { formatCliError, logger } from '@fastgpt-plugin/cli/helpers';
import type { Command } from 'commander';

type BuildCommandOptions = ToolBuildOptions & {
  verbose?: boolean;
};

export class BuildCommand extends BaseCommand {
  public register(parent: Command): void {
    const command = this.addCommonOptions(
      parent
        .command('build')
        .description('Build a distributable FastGPT plugin / 构建 FastGPT 插件')
        .option('-e, --entry <path>', '插件源码目录 / Plugin source directory', process.cwd())
        .option('-o, --output <path>', '输出目录 / Output directory', './dist')
        .option('-m, --minify', '压缩输出代码 / Minify output', false)
        .option('-f, --format <format>', '输出格式 / Output format: esm | cjs', 'esm')
    );

    command.action(async (opts: BuildCommandOptions) => {
      await this.run({
        entry: opts.entry,
        output: opts.output,
        minify: opts.minify,
        format: opts.format as 'esm' | 'cjs',
        verbose: opts.verbose
      });
    });
  }

  public async run(options: BuildCommandOptions): Promise<void> {
    const start = Date.now();
    try {
      const result = await buildToolPackage(options);

      const duration = ((Date.now() - start) / 1000).toFixed(2);

      logger.success(`构建完成，用时 ${duration}s`);
      logger.info(`输出目录: ${result.outputDir}`);

      // 显示输出文件
      if (result.files.length > 0) {
        logger.info('生成的文件列表:');
        result.files.forEach((file) => {
          logger.info(`• ${file}`);
        });
      } else {
        logger.info('未检测到输出文件，请检查配置。');
      }
    } catch (error) {
      logger.error('构建失败，详情如下:');
      logger.error(formatCliError(error, options.verbose));
      logger.info('如果这是在 CI 中发生的，请查看上方构建日志以获取更多信息。');
      process.exit(1);
    }
  }
}
