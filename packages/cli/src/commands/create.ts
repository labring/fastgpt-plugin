import type { Command } from 'commander';
import type { CreatePluginCommandOptions } from '@fastgpt-plugin/cli/interfaces/command';
import { logger } from '@fastgpt-plugin/cli/helpers';
import { DEFAULT_PLUGIN_DESCRIPTION, TOOL_TEMPLATES_DIR } from '@fastgpt-plugin/cli/constants';
import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { CreatePrompt } from '@fastgpt-plugin/cli/prompts/create';

export class CreateCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('create')
      .description('创建新的 FastGPT 插件项目')
      .argument('[name]', '插件名称')
      .option('-t, --type <type>', '插件类型: 单工具 | 工具集')
      .option('-d, --description <desc>', '插件描述')
      .option('--cwd <path>', '工作目录', process.cwd())
      .action(
        async (
          name: string | undefined,
          opts: { type?: string; description?: string; cwd: string }
        ) => {
          const createPrompt = new CreatePrompt();
          const options = await createPrompt.run({
            nameArg: name,
            typeFlag: opts.type,
            descriptionFlag: opts.description,
            cwd: opts.cwd
          });
          await this.run(options);
        }
      );
  }

  public async run(options: CreatePluginCommandOptions): Promise<void> {
    const targetDir = this.ctx.path.resolve(options.cwd, options.name);
    const templateDir = this.ctx.path.join(TOOL_TEMPLATES_DIR, options.type);
    const files = await this.collectTemplateFiles(templateDir);
    const description = options.description ?? DEFAULT_PLUGIN_DESCRIPTION;

    await this.ensureDir(targetDir);

    for (const rel of files) {
      const templatePath = this.ctx.path.join(templateDir, rel);
      const filePath = this.ctx.path.join(targetDir, rel);
      await this.ensureDir(this.ctx.path.dirname(filePath));
      const raw = await this.ctx.fs.readFile(templatePath, 'utf-8');
      const content = this.applyPlaceholders(raw, options.name, description);
      await this.ctx.fs.writeFile(filePath, content, 'utf-8');
    }

    logger.success(`创建插件项目: ${options.name}`);
  }

  private applyPlaceholders(text: string, name: string, description: string): string {
    name = this.ctx.path.basename(name);
    return text.replace(/\{\{name\}\}/g, name).replace(/\{\{description\}\}/g, description);
  }

  private async collectTemplateFiles(root: string): Promise<string[]> {
    const result: string[] = [];

    const walk = async (dir: string) => {
      const entries = await this.ctx.fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = this.ctx.path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          const rel = this.ctx.path.relative(root, full).replace(/\\/g, '/');
          result.push(rel);
        }
      }
    };

    await walk(root);
    return result.sort();
  }

  private async ensureDir(dir: string): Promise<void> {
    await this.ctx.fs.mkdir(dir, { recursive: true });
  }
}
