import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';

import { logger } from '@fastgpt-plugin/cli/helpers';
import { input } from '@inquirer/prompts';
import z from 'zod';

import { ConnectionGatewaySessionSchema } from '@domain/value-objects/connection-gateway.vo';

import { discoverDebugEntries } from './discover';
import {
  connectDebugGateway,
  type DebugGatewayClientOptions,
  type DebugGatewayTarget
} from './gateway';
import { type DebugPluginSnapshot, loadDebugSession } from './session';

export type RemoteDebugCommandOptions = {
  uploadDir?: string;
  connect?: string;
  reconnect?: boolean;
  noReconnect?: boolean;
  reconnectIntervalMs?: string;
  watch?: boolean;
  interactive?: boolean;
};

export type RemoteDebugSessionRunOptions = {
  entriesInput: string | string[];
  options: RemoteDebugCommandOptions;
  commandName: string;
  migrationHint?: string;
};

export async function runRemoteDebugSession({
  entriesInput,
  options,
  commandName,
  migrationHint
}: RemoteDebugSessionRunOptions): Promise<void> {
  if (migrationHint) {
    logger.warn(migrationHint);
  }

  if (options.watch) {
    await runWatchRemoteDebugSession({
      entriesInput,
      options,
      commandName
    });
    return;
  }

  await runRemoteDebugSessionOnce({
    entriesInput,
    options,
    commandName
  });
}

async function runRemoteDebugSessionOnce({
  entriesInput,
  options,
  commandName
}: Omit<RemoteDebugSessionRunOptions, 'migrationHint'>): Promise<void> {
  const entries = await resolveDebugEntries(entriesInput);
  const targets = await loadTargets(entries, options);
  await ensureConnectLink({
    options,
    commandName,
    targets
  });

  const gatewayOptions = await resolveGatewayOptions(options, targets[0].snapshot);
  const reporter = createRemoteDebugReporter({
    commandName,
    options,
    gatewayOptions,
    targets
  });
  reporter.start();

  const gateway = await connectDebugGateway({
    targets,
    options: gatewayOptions,
    onLog: (message) => reporter.log(`[gateway] ${message}`)
  });
  reporter.attachClose(() => gateway.close());
  const source = gateway.session.sessionScope.source ?? gatewayOptions.source ?? '-';

  reporter.ready(source);

  await gateway.closed;
  reporter.end();
}

async function runWatchRemoteDebugSession({
  entriesInput,
  options,
  commandName
}: Omit<RemoteDebugSessionRunOptions, 'migrationHint'>): Promise<void> {
  let closed = false;
  let currentGatewayClose: (() => void) | undefined;
  let restartResolve: (() => void) | undefined;
  const entries = await resolveDebugEntries(entriesInput);
  const initialTargets = await loadTargets(entries, options);
  await ensureConnectLink({
    options,
    commandName,
    targets: initialTargets
  });
  const watcher = watchDebugEntries(entries, () => {
    restartResolve?.();
    currentGatewayClose?.();
  });

  process.once('SIGINT', () => {
    closed = true;
    restartResolve?.();
    currentGatewayClose?.();
    watcher.close();
  });

  try {
    while (!closed) {
      const restart = new Promise<void>((resolve) => {
        restartResolve = resolve;
      });
      await runRemoteDebugSessionOnceWithCloseHook({
        entries,
        options,
        commandName,
        onCloseReady: (close) => {
          currentGatewayClose = close;
        },
        restart
      }).catch((error) => {
        if (!closed) {
          logger.error(error);
        }
      });

      currentGatewayClose = undefined;
      restartResolve = undefined;

      if (!closed) {
        logger.info('检测到插件文件变化，正在重载远程调试会话。');
        await delay(300);
      }
    }
  } finally {
    watcher.close();
  }
}

async function runRemoteDebugSessionOnceWithCloseHook({
  entries,
  options,
  commandName,
  onCloseReady,
  restart
}: {
  entries: string[];
  options: RemoteDebugCommandOptions;
  commandName: string;
  onCloseReady(close: () => void): void;
  restart: Promise<void>;
}): Promise<void> {
  const targets = await loadTargets(entries, options);
  await ensureConnectLink({
    options,
    commandName,
    targets
  });

  const gatewayOptions = await resolveGatewayOptions(options, targets[0].snapshot);
  const reporter = createRemoteDebugReporter({
    commandName,
    options,
    gatewayOptions,
    targets
  });
  reporter.start();

  const gateway = await connectDebugGateway({
    targets,
    options: gatewayOptions,
    onLog: (message) => reporter.log(`[gateway] ${message}`)
  });
  reporter.attachClose(() => gateway.close());
  onCloseReady(() => gateway.close());
  const source = gateway.session.sessionScope.source ?? gatewayOptions.source ?? '-';
  reporter.ready(source);

  await Promise.race([gateway.closed, restart]);
  gateway.close();
  await gateway.closed.catch(() => undefined);
  reporter.end();
}

async function resolveDebugEntries(entriesInput: string | string[]): Promise<string[]> {
  const rawEntries = Array.isArray(entriesInput) ? entriesInput : [entriesInput];
  const entries = rawEntries.filter((entry) => entry.trim().length > 0);

  if (entries.length > 0) {
    return entries.map((entry) => path.resolve(entry));
  }

  const discovered = await discoverDebugEntries();
  logger.info(
    [
      `自动发现 ${discovered.length} 个可调试插件:`,
      ...discovered.map((entry) => `  - ${entry}`)
    ].join('\n')
  );
  return discovered;
}

async function loadTargets(
  entries: string[],
  options: RemoteDebugCommandOptions
): Promise<DebugGatewayTarget[]> {
  const targets: DebugGatewayTarget[] = [];
  for (const [index, entryDir] of entries.entries()) {
    const session = await loadDebugSession({
      entryDir,
      uploadDir: resolveUploadDir({
        entryDir,
        index,
        total: entries.length,
        uploadDir: options.uploadDir
      })
    });
    targets.push({
      runtime: session.runtime,
      snapshot: session.snapshot
    });
  }

  const duplicatePluginIds = findDuplicateValues(
    targets.map((target) => target.snapshot.pluginId)
  );
  if (duplicatePluginIds.length > 0) {
    throw new Error(`gateway pluginId 重复: ${duplicatePluginIds.join(', ')}`);
  }

  return targets;
}

function watchDebugEntries(entries: string[], onChange: () => void): { close(): void } {
  const watchers = entries.map((entry) =>
    fsWatch(entry, {
      recursive: true,
      onChange
    })
  );

  return {
    close() {
      watchers.forEach((watcher) => watcher.close());
    }
  };
}

function fsWatch(
  dir: string,
  {
    recursive,
    onChange
  }: {
    recursive: boolean;
    onChange: () => void;
  }
) {
  let timer: NodeJS.Timeout | undefined;
  const watcher = fs.watch(dir, { recursive }, () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 150);
  });

  return {
    close() {
      clearTimeout(timer);
      watcher.close();
    }
  };
}

function createRemoteDebugReporter({
  commandName,
  options,
  gatewayOptions,
  targets
}: {
  commandName: string;
  options: RemoteDebugCommandOptions;
  gatewayOptions: DebugGatewayClientOptions;
  targets: DebugGatewayTarget[];
}): RemoteDebugReporter {
  const summary = {
    commandName,
    mode: 'FastGPT connect link',
    tcp: `${gatewayOptions.tcpHost}:${gatewayOptions.tcpPort}`,
    reconnect: gatewayOptions.reconnect === false ? 'off' : 'on',
    targets: targets.map((target) => target.snapshot)
  };
  const canUseTui =
    options.interactive !== false && Boolean(process.stdout.isTTY) && Boolean(process.stdin.isTTY);

  return canUseTui ? new TuiRemoteDebugReporter(summary) : new PlainRemoteDebugReporter(summary);
}

async function ensureConnectLink({
  options,
  commandName,
  targets
}: {
  options: RemoteDebugCommandOptions;
  commandName: string;
  targets: DebugGatewayTarget[];
}): Promise<void> {
  if (options.connect) {
    return;
  }

  if (options.interactive === false || !process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('dev 需要 --connect，或在交互式终端中输入 FastGPT connect link。');
  }

  const connectUrl = await promptConnectLink({
    commandName,
    targets
  });
  options.connect = connectUrl;
}

async function promptConnectLink({
  commandName,
  targets
}: {
  commandName: string;
  targets: DebugGatewayTarget[];
}): Promise<string> {
  process.stdout.write(
    [
      '\x1b[?25h\x1b[2J\x1b[HFastGPT Plugin Dev',
      '',
      `Command   fastgpt-plugin ${commandName}`,
      'Mode      waiting for FastGPT connect link',
      'Status    pending',
      '',
      'Plugins',
      ...targets.map((target) => `  ${target.snapshot.pluginId}@${target.snapshot.version}`),
      '',
      'Paste the FastGPT connect link to start the TCP debug session.',
      ''
    ].join('\n')
  );

  const connectUrl = await input({
    message: 'FastGPT connect link',
    validate(value) {
      return value.trim().length > 0 || '请输入 FastGPT connect link';
    }
  });

  return connectUrl.trim();
}

function formatTargetLine(snapshot: DebugPluginSnapshot): string {
  const tools = snapshot.tools.map((tool) => tool.id).join(', ') || '-';
  return `    - ${snapshot.pluginId}@${snapshot.version} tools=[${tools}] entry=${snapshot.entryDir}`;
}

type RemoteDebugReporterSummary = {
  commandName: string;
  mode: string;
  tcp: string;
  reconnect: string;
  targets: DebugPluginSnapshot[];
};

type RemoteDebugReporter = {
  start(): void;
  log(message: string): void;
  ready(source: string): void;
  attachClose(close: () => void): void;
  end(): void;
};

class PlainRemoteDebugReporter implements RemoteDebugReporter {
  constructor(private readonly summary: RemoteDebugReporterSummary) {}

  start(): void {
    logger.info(
      [
        'FastGPT 插件开发会话',
        `  command: fastgpt-plugin ${this.summary.commandName}`,
        `  mode: ${this.summary.mode}`,
        '  ui: plain',
        `  tcp: ${this.summary.tcp}`,
        `  reconnect: ${this.summary.reconnect}`,
        '  plugins:',
        ...this.summary.targets.map(formatTargetLine)
      ].join('\n')
    );
  }

  log(message: string): void {
    logger.info(message);
  }

  ready(source: string): void {
    this.summary.targets.forEach((target) => {
      logger.success(`远程调试已就绪: ${source} ${target.pluginId}`);
    });
    logger.info(
      `已建立 1 个远程调试通道，挂载 ${this.summary.targets.length} 个插件，按 Ctrl+C 停止。`
    );
  }

  attachClose(): void {
    return;
  }

  end(): void {
    logger.info('远程调试会话已结束。');
  }
}

class TuiRemoteDebugReporter implements RemoteDebugReporter {
  private status = 'connecting';
  private source = '-';
  private logs: string[] = [];
  private closeSession: (() => void) | undefined;
  private readonly onKeypress = (_input: string, key: readline.Key) => {
    if (key.ctrl && key.name === 'c') {
      this.closeSession?.();
      return;
    }
    if (key.name === 'q') {
      this.log('收到退出指令，正在关闭远程调试会话。');
      this.closeSession?.();
    }
  };

  constructor(private readonly summary: RemoteDebugReporterSummary) {}

  start(): void {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.on('keypress', this.onKeypress);
    this.render();
  }

  log(message: string): void {
    this.logs.push(message);
    this.logs = this.logs.slice(-6);
    this.render();
  }

  ready(source: string): void {
    this.status = 'connected';
    this.source = source;
    this.log(`远程调试已就绪，挂载 ${this.summary.targets.length} 个插件。`);
  }

  attachClose(close: () => void): void {
    this.closeSession = close;
  }

  end(): void {
    this.status = 'closed';
    this.render();
    process.stdin.off('keypress', this.onKeypress);
    process.stdin.setRawMode?.(false);
    process.stdin.pause();
    process.stdout.write('\x1b[?25h');
    logger.info('远程调试会话已结束。');
  }

  private render(): void {
    const lines = [
      'FastGPT Plugin Dev',
      '',
      `Command   fastgpt-plugin ${this.summary.commandName}`,
      `Mode      ${this.summary.mode}`,
      `Status    ${this.status}`,
      `Source    ${this.source}`,
      `TCP       ${this.summary.tcp}`,
      `Reconnect ${this.summary.reconnect}`,
      '',
      'Plugins',
      ...this.summary.targets.map((target) => `  ${target.pluginId}@${target.version}`),
      '',
      'Logs',
      ...(this.logs.length > 0 ? this.logs.map((line) => `  ${line}`) : ['  -']),
      '',
      'Press q to stop. Press Ctrl+C to exit.'
    ];

    process.stdout.write(`\x1b[?25l\x1b[2J\x1b[H${lines.join('\n')}\n`);
  }
}

async function resolveGatewayOptions(
  options: RemoteDebugCommandOptions,
  _snapshot: DebugPluginSnapshot
): Promise<DebugGatewayClientOptions> {
  if (!options.connect) {
    throw new Error('dev 需要 --connect 来建立远程调试通道。');
  }

  return resolveConnectGatewayOptions(options);
}

async function resolveConnectGatewayOptions(
  options: RemoteDebugCommandOptions
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
    reconnect: options.noReconnect ? false : options.reconnect ?? true,
    reconnectIntervalMs: toPositiveInt(
      options.reconnectIntervalMs ?? process.env.CONNECTION_GATEWAY_RECONNECT_INTERVAL_MS ?? '2000',
      'reconnect-interval-ms'
    ),
    precreatedSession: {
      session: info.session,
      connectToken: info.connectToken
    }
  };
}

function resolveUploadDir({
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

  return path.resolve(uploadDir, `${index + 1}-${sanitizePathSegment(path.basename(entryDir))}`);
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

function toPositiveInt(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} 必须是正整数。`);
  }

  return parsed;
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
