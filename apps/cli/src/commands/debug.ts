import fs from 'node:fs/promises';
import path from 'node:path';

import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import {
  type RemoteDebugCommandOptions,
  runRemoteDebugSession
} from '@fastgpt-plugin/cli/debug/remote-session';
import {
  type DebugPluginSnapshot,
  type DebugToolSnapshot,
  loadDebugSession,
  runDebugTool
} from '@fastgpt-plugin/cli/debug/session';
import { logger } from '@fastgpt-plugin/cli/helpers';
import type { Command } from 'commander';

import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

type DebugCommandOptions = RemoteDebugCommandOptions & {
  tool?: string;
  run?: boolean;
  input?: string;
  inputFile?: string;
  secrets?: string;
  secretsFile?: string;
  systemVar?: string;
  systemVarFile?: string;
};

export class DebugCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('debug <entries...>')
      .description('直接加载本地插件目录并调试工具')
      .option('-t, --tool <childId>', '工具集子工具 ID')
      .option('--run', '立即执行一次工具调试', false)
      .option('-i, --input <json>', '工具输入 JSON 字符串')
      .option('--input-file <path>', '工具输入 JSON 文件路径')
      .option('--secrets <json>', 'secrets JSON 字符串')
      .option('--secrets-file <path>', 'secrets JSON 文件路径')
      .option('--system-var <json>', 'systemVar JSON 字符串')
      .option('--system-var-file <path>', 'systemVar JSON 文件路径')
      .option('--upload-dir <path>', '虚拟 uploadFile 的输出目录')
      .option('--connect <keyOrUrl>', '兼容入口：FastGPT debug connection key 或 connect link，建议改用 dev 命令')
      .option('--reconnect', '兼容入口：断线后自动重连', true)
      .option('--no-reconnect', '兼容入口：关闭自动重连')
      .option('--reconnect-interval-ms <ms>', '兼容入口：重连间隔')
      .action(async (entries: string[], opts: DebugCommandOptions) => {
        await this.run(entries, opts);
      });
  }

  public async run(entriesInput: string | string[], options: DebugCommandOptions): Promise<void> {
    const entries = (Array.isArray(entriesInput) ? entriesInput : [entriesInput]).map((entry) =>
      path.resolve(entry)
    );
    const isMultiEntry = entries.length > 1;

    if (options.connect) {
      await runRemoteDebugSession({
        entriesInput,
        options,
        commandName: 'dev',
        migrationHint: 'debug --connect 是兼容入口，远程集成调试建议改用 fastgpt-plugin dev。'
      });
      return;
    }

    if (isMultiEntry && !options.connect) {
      throw new Error('debug 是轻量本地调试入口，一次只支持一个插件；多插件远程调试请使用 dev。');
    }

    if (isMultiEntry && options.run) {
      throw new Error('--run 只支持单个插件入口。');
    }

    const sessions = [];
    for (const [index, entryDir] of entries.entries()) {
      sessions.push(
        await loadDebugSession({
          entryDir,
          uploadDir: this.resolveUploadDir({
            entryDir,
            index,
            total: entries.length,
            uploadDir: options.uploadDir
          })
        })
      );
    }

    sessions.forEach((session) => {
      this.printSnapshot(session.snapshot, session.uploadDir);
    });

    const duplicatePluginIds = findDuplicateValues(
      sessions.map((session) => session.snapshot.pluginId)
    );
    if (duplicatePluginIds.length > 0) {
      throw new Error(`gateway pluginId 重复: ${duplicatePluginIds.join(', ')}`);
    }

    const [session] = sessions;

    if (!options.run) {
      return;
    }

    const input = await this.readJsonOption(options.input, options.inputFile, 'input');
    const secrets = await this.readJsonOption(options.secrets, options.secretsFile, 'secrets');
    const systemVar = (await this.readJsonOption(
      options.systemVar,
      options.systemVarFile,
      'systemVar'
    )) as Partial<SystemVarType> | undefined;

    const result = await runDebugTool({
      runtime: session.runtime,
      snapshot: session.snapshot,
      toolId: options.tool,
      input: input ?? {},
      secrets,
      systemVar
    });

    logger.success(
      `本地调试执行完成: ${session.snapshot.isToolSet ? options.tool ?? '' : session.snapshot.pluginId}`.trim()
    );
    logger.info(`虚拟时间: ${result.systemVar.time}`);

    this.printStreamMessages(result.streamMessages);

    if (result.response) {
      logger.info(`返回结果:\n${JSON.stringify(result.response, null, 2)}`);
    }

    if (result.error) {
      logger.error(result.error);
      process.exit(1);
    }
  }

  private printSnapshot(snapshot: DebugPluginSnapshot, uploadDir: string): void {
    const lines = [
      '插件信息',
      `  entry: ${snapshot.entryDir}`,
      `  index: ${snapshot.indexPath}`,
      `  pluginId: ${snapshot.pluginId}`,
      `  version: ${snapshot.version}`,
      `  name: ${snapshot.name || '-'}`,
      `  description: ${snapshot.description || '-'}`,
      `  toolDescription: ${snapshot.toolDescription || '-'}`,
      `  author: ${snapshot.author ?? '-'}`,
      `  tags: ${snapshot.tags?.join(', ') ?? '-'}`,
      `  permissions: ${snapshot.permissions?.join(', ') ?? '-'}`,
      `  uploadDir: ${uploadDir}`,
      `  secretKeys: ${this.formatSchemaKeys(snapshot.secretSchema)}`
    ];

    logger.info(lines.join('\n'));

    const toolLines = ['可调试工具'];
    snapshot.tools.forEach((tool) => {
      toolLines.push(`  - id: ${tool.id}`);
      toolLines.push(`    name: ${tool.name || '-'}`);
      toolLines.push(`    description: ${tool.description || '-'}`);
      toolLines.push(`    inputKeys: ${this.formatSchemaKeys(tool.inputSchema)}`);
      toolLines.push(`    command: ${this.buildCommand(snapshot, tool)}`);
    });
    logger.info(toolLines.join('\n'));
  }

  private printStreamMessages(messages: ToolStreamMessageType[]): void {
    if (messages.length === 0) {
      logger.info('流式输出: 无');
      return;
    }

    const lines = ['流式输出'];

    messages.forEach((message) => {
      switch (message.type) {
        case 'stream':
          lines.push(`  [${message.data.type}] ${message.data.content}`);
          break;
        case 'response':
          lines.push('  [response] 已收到最终返回结果');
          break;
        case 'error':
          lines.push(`  [error] ${message.data}`);
          break;
      }
    });

    logger.info(lines.join('\n'));
  }

  private buildCommand(snapshot: DebugPluginSnapshot, tool: DebugToolSnapshot): string {
    const args = [
      'fastgpt-plugin',
      'debug',
      snapshot.entryDir,
      '--run',
      ...(snapshot.isToolSet ? ['--tool', tool.id] : []),
      '--input',
      JSON.stringify(this.createInputExample(tool.inputSchema))
    ];

    return args.map(quoteShellArg).join(' ');
  }

  private resolveUploadDir({
    entryDir,
    index,
    total,
    uploadDir
  }: {
    entryDir: string;
    index: number;
    total: number;
    uploadDir?: string;
  }): string {
    if (!uploadDir) {
      return path.resolve(path.join(entryDir, '.fastgpt-plugin-debug/uploads'));
    }

    if (total === 1) {
      return path.resolve(uploadDir);
    }

    return path.resolve(
      uploadDir,
      `${index + 1}-${sanitizePathSegment(path.basename(entryDir))}`
    );
  }

  private createInputExample(schema: Record<string, unknown>): unknown {
    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
      return schema.enum[0];
    }

    if ('const' in schema) {
      return schema.const;
    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
      return this.createInputExample(asObject(schema.anyOf[0]));
    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      return this.createInputExample(asObject(schema.oneOf[0]));
    }

    switch (schema.type) {
      case 'object': {
        const properties = asObject(schema.properties);
        return Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [
            key,
            this.createInputExample(asObject(value))
          ])
        );
      }
      case 'array':
        return [];
      case 'integer':
      case 'number':
        return 0;
      case 'boolean':
        return true;
      case 'string':
        return '';
      default:
        return {};
    }
  }

  private formatSchemaKeys(schema: Record<string, unknown>): string {
    const properties = asObject(schema.properties);
    const keys = Object.keys(properties);
    return keys.length > 0 ? keys.join(', ') : '-';
  }

  private async readJsonOption(
    inlineValue: string | undefined,
    filePath: string | undefined,
    label: string
  ): Promise<Record<string, unknown> | undefined> {
    if (!inlineValue && !filePath) {
      return undefined;
    }

    if (inlineValue && filePath) {
      throw new Error(`${label} 只能传入一种来源：JSON 字符串或 JSON 文件。`);
    }

    const raw = inlineValue ?? (await fs.readFile(path.resolve(filePath as string), 'utf-8'));

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error();
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(`${label} 解析失败，请提供合法的 JSON object。`);
    }
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function quoteShellArg(value: string): string {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function findDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }
    seen.add(value);
  });

  return [...duplicates];
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_') || 'plugin';
}
