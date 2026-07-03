import fs from 'node:fs/promises';
import path from 'node:path';

import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import { DEFAULT_PLUGIN_DESCRIPTION, TOOL_TEMPLATES_DIR } from '@fastgpt-plugin/cli/constants';
import { logger } from '@fastgpt-plugin/cli/helpers';
import type {
  CreatePluginCommandOptions,
  TemplateDependencyMode
} from '@fastgpt-plugin/cli/interfaces/command';
import { CreatePrompt } from '@fastgpt-plugin/cli/prompts/create';
import type { Command } from 'commander';
import { kebabCase } from 'es-toolkit';

const TEMPLATE_DEPENDENCY_VERSIONS = {
  '@fastgpt-plugin/cli': '^0.2.0',
  '@fastgpt-plugin/sdk-factory': '^0.0.1',
  typescript: '^5.9.3',
  vitest: '^4.0.18',
  zod: '^4'
} as const;

export class CreateCommand extends BaseCommand {
  public register(parent: Command): void {
    const command = this.addCommonOptions(
      parent
        .command('create')
        .description('Create a new FastGPT plugin project / 创建新的 FastGPT 插件项目')
        .argument('[name]', '插件名称 / Plugin name')
        .option('-t, --type <type>', '插件类型 / Plugin type: tool | tool-suite')
        .option('-d, --description <desc>', '插件描述 / Plugin description')
        .option('--cwd <path>', '工作目录 / Working directory', process.cwd())
        .option(
          '--dependency-mode <mode>',
          '依赖版本模式 / Dependency version mode: semver | catalog',
          'semver'
        )
    );

    command.action(
      async (
        name: string | undefined,
        opts: { type?: string; description?: string; cwd: string; dependencyMode?: string }
      ) => {
        const createPrompt = new CreatePrompt();
        const options = await createPrompt.run({
          nameArg: name,
          typeFlag: opts.type,
          descriptionFlag: opts.description,
          dependencyModeFlag: opts.dependencyMode,
          cwd: opts.cwd
        });
        await this.run(options);
      }
    );
  }

  public async run(options: CreatePluginCommandOptions): Promise<void> {
    const targetDir = path.resolve(options.cwd, options.name);
    const templateDir = path.join(TOOL_TEMPLATES_DIR, 'tool');
    const files = await this.collectTemplateFiles(templateDir);
    const description = options.description ?? DEFAULT_PLUGIN_DESCRIPTION;

    await this.ensureDir(targetDir);

    for (const rel of files) {
      const templatePath = path.join(templateDir, rel);
      const filePath = path.join(targetDir, rel);
      await this.ensureDir(path.dirname(filePath));
      const raw = await fs.readFile(templatePath, 'utf-8');
      const content = this.applyPlaceholders(
        raw,
        options.name,
        description,
        options.type,
        options.dependencyMode
      );
      await fs.writeFile(filePath, content, 'utf-8');
    }

    await this.finalizeIndexTemplate(targetDir, options.type);

    logger.success(`创建插件项目: ${options.name} (${options.type})`, {
      cwd: options.cwd
    });
  }

  private applyPlaceholders(
    text: string,
    name: string,
    description: string,
    type: CreatePluginCommandOptions['type'],
    dependencyMode: TemplateDependencyMode
  ): string {
    name = path.basename(name);
    name = kebabCase(name);
    return text
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{description\}\}/g, description)
      .replace(/\{\{debugRunInput\}\}/g, this.pickDebugRunInput(type))
      .replace(/\{\{debugRunInputJson\}\}/g, this.pickDebugRunInputJson(type))
      .replace(/\{\{debugRunToolOption\}\}/g, this.pickDebugRunToolOption(type))
      .replace(/\{\{dependencyMode\}\}/g, dependencyMode)
      .replace(
        /\{\{cliPackageVersion\}\}/g,
        this.pickDependencyVersion('@fastgpt-plugin/cli', dependencyMode)
      )
      .replace(
        /\{\{sdkFactoryPackageVersion\}\}/g,
        this.pickDependencyVersion('@fastgpt-plugin/sdk-factory', dependencyMode)
      )
      .replace(
        /\{\{typescriptPackageVersion\}\}/g,
        this.pickDependencyVersion('typescript', dependencyMode)
      )
      .replace(
        /\{\{vitestPackageVersion\}\}/g,
        this.pickDependencyVersion('vitest', dependencyMode)
      )
      .replace(/\{\{zodPackageVersion\}\}/g, this.pickDependencyVersion('zod', dependencyMode));
  }

  private pickDebugRunInput(type: CreatePluginCommandOptions['type']): string {
    return type === 'tool-suite' ? '{"query":"select 1"}' : '{"delay":0}';
  }

  private pickDebugRunInputJson(type: CreatePluginCommandOptions['type']): string {
    return this.pickDebugRunInput(type).replace(/"/g, '\\"');
  }

  private pickDebugRunToolOption(type: CreatePluginCommandOptions['type']): string {
    return type === 'tool-suite' ? ' --tool mysql' : '';
  }

  private pickDependencyVersion(
    name: keyof typeof TEMPLATE_DEPENDENCY_VERSIONS,
    dependencyMode: TemplateDependencyMode
  ): string {
    return dependencyMode === 'catalog' ? 'catalog:' : TEMPLATE_DEPENDENCY_VERSIONS[name];
  }

  private async collectTemplateFiles(root: string): Promise<string[]> {
    const result: string[] = [];

    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          const rel = path.relative(root, full).replace(/\\/g, '/');
          result.push(rel);
        }
      }
    };

    await walk(root);
    return result.sort();
  }

  private async finalizeIndexTemplate(
    targetDir: string,
    type: CreatePluginCommandOptions['type']
  ): Promise<void> {
    const toolIndexPath = path.join(targetDir, 'index.tool.ts');
    const toolSetIndexPath = path.join(targetDir, 'index.toolset.ts');
    const finalIndexPath = path.join(targetDir, 'index.ts');

    const sourcePath = type === 'tool-suite' ? toolSetIndexPath : toolIndexPath;
    const cleanupTargets = [toolIndexPath, toolSetIndexPath];

    await fs.rename(sourcePath, finalIndexPath);

    await Promise.all(
      cleanupTargets.map(async (filePath) => {
        if (filePath === sourcePath) return;
        await fs.rm(filePath, { force: true });
      })
    );
  }

  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }
}
