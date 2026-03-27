import type { Command } from 'commander';
import { logger } from '@fastgpt-plugin/cli/helpers';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { buildToolPackage, type ToolBuildOptions } from '@fastgpt-plugin/cli/build';

export class BuildCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('build')
      .description('构建 FastGPT 插件为可分发的包')
      .option('-e, --entry <path>', '工具入口目录', process.cwd())
      .option('-o, --output <path>', '输出目录', './dist')
      .option('-m, --minify', '压缩输出代码', false)
      .option('-f, --format <format>', '输出格式: esm | cjs', 'esm')
      .action(async (opts: ToolBuildOptions) => {
        await this.run({
          entry: opts.entry,
          output: opts.output,
          minify: opts.minify,
          format: opts.format as 'esm' | 'cjs'
        });
      });
  }

  public async run(options: ToolBuildOptions): Promise<void> {
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
      logger.error(error instanceof Error ? error : new Error(String(error)));
      logger.info('如果这是在 CI 中发生的，请查看上方构建日志以获取更多信息。');
      process.exit(1);
    }
  }
}
