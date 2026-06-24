import fs from 'node:fs/promises';
import path from 'node:path';

import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import {
  connectDebugGateway,
  type DebugGatewayClientOptions,
  type DebugGatewayTarget
} from '@fastgpt-plugin/cli/debug/gateway';
import {
  type DebugPluginSnapshot,
  type DebugToolSnapshot,
  loadDebugSession,
  runDebugTool
} from '@fastgpt-plugin/cli/debug/session';
import { logger } from '@fastgpt-plugin/cli/helpers';
import type { Command } from 'commander';
import z from 'zod';

import { ConnectionGatewaySessionSchema } from '@domain/value-objects/connection-gateway.vo';
import type { SystemVarType } from '@domain/value-objects/system-var.vo';
import type { ToolStreamMessageType } from '@domain/value-objects/tool.vo';

type DebugCommandOptions = {
  tool?: string;
  run?: boolean;
  input?: string;
  inputFile?: string;
  secrets?: string;
  secretsFile?: string;
  systemVar?: string;
  systemVarFile?: string;
  uploadDir?: string;
  gateway?: boolean;
  connect?: string;
  gatewayBaseUrl?: string;
  gatewayAuthToken?: string;
  gatewayJwtSecret?: string;
  gatewayTcpUrl?: string;
  gatewayTcpHost?: string;
  gatewayTcpPort?: string;
  gatewayUserId?: string;
  gatewayTeamId?: string;
  gatewaySource?: string;
  gatewaySubject?: string;
  gatewayTokenTtlMs?: string;
  gatewayReconnect?: boolean;
  gatewayNoReconnect?: boolean;
  gatewayReconnectIntervalMs?: string;
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
      .option('--gateway', '连接 Connection Gateway，等待远程调试请求', false)
      .option('--connect <url>', 'FastGPT debug connect link，通过 ticket 换取远程调试连接信息')
      .option('--gateway-base-url <url>', 'Connection Gateway HTTP 地址')
      .option('--gateway-auth-token <token>', 'Connection Gateway AUTH_TOKEN')
      .option('--gateway-jwt-secret <secret>', 'Connection Gateway JWT_SECRET')
      .option('--gateway-tcp-url <url>', 'Connection Gateway TCP 地址，如 tcp://host:port')
      .option('--gateway-tcp-host <host>', 'Connection Gateway TCP host')
      .option('--gateway-tcp-port <port>', 'Connection Gateway TCP port')
      .option('--gateway-user-id <id>', 'debug session userId')
      .option('--gateway-team-id <id>', 'debug session teamId')
      .option('--gateway-source <source>', 'debug source，建议包含 user 维度')
      .option('--gateway-subject <subject>', 'debug session subject')
      .option('--gateway-token-ttl-ms <ms>', 'connection token TTL')
      .option('--gateway-reconnect', 'Connection Gateway 断线后自动重连', true)
      .option('--gateway-no-reconnect', '关闭 Connection Gateway 自动重连')
      .option('--gateway-reconnect-interval-ms <ms>', 'Connection Gateway 重连间隔')
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
      options.gateway = true;
    }

    if (isMultiEntry && !options.gateway && !options.connect) {
      throw new Error('多个插件同时调试需要使用 --gateway 或 --connect。');
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

    if (options.gateway) {
      await this.runGatewaySession({
        sessions,
        options
      });
      return;
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

  private resolveGatewayOptions(
    options: DebugCommandOptions,
    snapshot: DebugPluginSnapshot
  ): Promise<DebugGatewayClientOptions> | DebugGatewayClientOptions {
    if (options.connect) {
      return this.resolveConnectGatewayOptions(options);
    }

    const userId = options.gatewayUserId ?? process.env.CONNECTION_GATEWAY_USER_ID ?? 'debug-user';
    const tcpEndpoint = resolveGatewayTcpEndpoint(options);

    return {
      baseUrl:
        options.gatewayBaseUrl ??
        process.env.CONNECTION_GATEWAY_BASE_URL ??
        'http://127.0.0.1:3010',
      authToken:
        options.gatewayAuthToken ??
        process.env.CONNECTION_GATEWAY_AUTH_TOKEN ??
        process.env.AUTH_TOKEN ??
        'token',
      jwtSecret: options.gatewayJwtSecret ?? process.env.JWT_SECRET ?? 'fastgpt-plugin-secret',
      tcpHost: tcpEndpoint.host,
      tcpPort: tcpEndpoint.port,
      userId,
      teamId: options.gatewayTeamId ?? process.env.CONNECTION_GATEWAY_TEAM_ID,
      source: this.resolveGatewaySource(options, snapshot),
      subject: options.gatewaySubject ?? process.env.CONNECTION_GATEWAY_SUBJECT,
      tokenTtlMs: toPositiveInt(
        options.gatewayTokenTtlMs ?? process.env.CONNECTION_GATEWAY_TOKEN_TTL_MS ?? '300000',
        'gateway-token-ttl-ms'
      ),
      reconnect: options.gatewayNoReconnect ? false : options.gatewayReconnect ?? true,
      reconnectIntervalMs: toPositiveInt(
        options.gatewayReconnectIntervalMs ??
          process.env.CONNECTION_GATEWAY_RECONNECT_INTERVAL_MS ??
          '2000',
        'gateway-reconnect-interval-ms'
      )
    };
  }

  private async resolveConnectGatewayOptions(
    options: DebugCommandOptions
  ): Promise<DebugGatewayClientOptions> {
    const info = await exchangeConnectLink(options.connect as string);
    const tcpEndpoint = parseGatewayTcpUrl(info.tcpUrl);

    return {
      baseUrl: '',
      tcpHost: tcpEndpoint.host,
      tcpPort: tcpEndpoint.port,
      userId: info.tmbId,
      source: info.source,
      tokenTtlMs: Math.max(1, info.expiresAt - Date.now()),
      reconnect: options.gatewayNoReconnect ? false : options.gatewayReconnect ?? true,
      reconnectIntervalMs: toPositiveInt(
        options.gatewayReconnectIntervalMs ??
          process.env.CONNECTION_GATEWAY_RECONNECT_INTERVAL_MS ??
          '2000',
        'gateway-reconnect-interval-ms'
      ),
      precreatedSession: {
        session: info.session,
        connectToken: info.connectToken
      }
    };
  }

  private resolveGatewaySource(
    options: DebugCommandOptions,
    _snapshot: DebugPluginSnapshot
  ): string {
    const userId = options.gatewayUserId ?? process.env.CONNECTION_GATEWAY_USER_ID ?? 'debug-user';
    const explicitSource = this.getExplicitGatewaySource(options);

    if (explicitSource) {
      return explicitSource;
    }

    return makeDefaultGatewaySource(userId);
  }

  private getExplicitGatewaySource(options: DebugCommandOptions): string | undefined {
    return options.gatewaySource ?? process.env.CONNECTION_GATEWAY_SOURCE;
  }

  private async runGatewaySession({
    sessions,
    options
  }: {
    sessions: Array<{
      runtime: Awaited<ReturnType<typeof loadDebugSession>>['runtime'];
      snapshot: DebugPluginSnapshot;
    }>;
    options: DebugCommandOptions;
  }): Promise<void> {
    const targets: DebugGatewayTarget[] = sessions.map((session) => ({
      runtime: session.runtime,
      snapshot: session.snapshot
    }));
    const gatewayOptions = await this.resolveGatewayOptions(options, sessions[0].snapshot);
    const gateway = await connectDebugGateway({
      targets,
      options: gatewayOptions,
      onLog: (message) => logger.info(message)
    });
    const source = gateway.session.sessionScope.source ?? gatewayOptions.source ?? '-';

    targets.forEach((target) => {
      logger.success(`远程调试已就绪: ${source} ${target.snapshot.pluginId}`);
    });
    logger.info(`已建立 1 个远程调试通道，挂载 ${targets.length} 个插件，按 Ctrl+C 停止。`);
    await gateway.closed;
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

function toPositiveInt(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} 必须是正整数。`);
  }

  return parsed;
}

function makeDefaultGatewaySource(userId: string): string {
  return `debug:user:${userId}`;
}

function resolveGatewayTcpEndpoint(options: DebugCommandOptions): { host: string; port: number } {
  const tcpUrl = options.gatewayTcpUrl ?? process.env.CONNECTION_GATEWAY_TCP_URL;

  if (tcpUrl) {
    return parseGatewayTcpUrl(tcpUrl);
  }

  return {
    host: options.gatewayTcpHost ?? process.env.CONNECTION_GATEWAY_TCP_HOST ?? '127.0.0.1',
    port: toPositiveInt(
      options.gatewayTcpPort ?? process.env.CONNECTION_GATEWAY_TCP_PORT ?? '3011',
      'gateway-tcp-port'
    )
  };
}

const ConnectInfoSchema = z.object({
  tcpUrl: z.string().min(1),
  source: z.string().min(1),
  sessionId: z.string().min(1),
  connectToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
  session: ConnectionGatewaySessionSchema.optional()
});

async function exchangeConnectLink(connectUrl: string) {
  const response = await fetch(connectUrl);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`connect link 请求失败: ${response.status} ${text}`);
  }

  const info = ConnectInfoSchema.parse(payload.data ?? payload);
  const session =
    info.session ??
    ConnectionGatewaySessionSchema.parse({
      id: info.sessionId,
      consumerType: 'plugin-debug',
      subject: parseTmbIdFromDebugSource(info.source),
      sessionScope: {
        userId: parseTmbIdFromDebugSource(info.source),
        source: info.source
      },
      transport: 'tcp',
      capabilities: ['gateway.bind', 'invoke'],
      generation: 0,
      ownerNodeId: 'remote',
      status: 'connecting',
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      expiresAt: info.expiresAt,
      metadata: {
        connectToken: info.connectToken
      }
    });

  return {
    ...info,
    tmbId: parseTmbIdFromDebugSource(info.source),
    session
  };
}

function parseTmbIdFromDebugSource(source: string): string {
  const parts = source.split(':');
  const index = parts.indexOf('tmbId');
  const tmbId = index >= 0 ? parts[index + 1] : undefined;
  if (!tmbId) {
    throw new Error(`debug source 缺少 tmbId: ${source}`);
  }
  return tmbId;
}

function parseGatewayTcpUrl(tcpUrl: string): { host: string; port: number } {
  const parsed = new URL(tcpUrl);
  if (parsed.protocol !== 'tcp:') {
    throw new Error('gateway-tcp-url 必须使用 tcp:// 协议。');
  }
  if (!parsed.hostname || !parsed.port) {
    throw new Error('gateway-tcp-url 必须包含 host 和 port。');
  }

  return {
    host: parsed.hostname,
    port: toPositiveInt(parsed.port, 'gateway-tcp-url port')
  };
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
