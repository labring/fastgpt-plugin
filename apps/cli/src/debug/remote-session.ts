import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { logger } from '@fastgpt-plugin/cli/helpers';
import { input } from '@inquirer/prompts';
import { Box, type Instance,render as renderInk, Text, useInput } from 'ink';
import React from 'react';
import z from 'zod';

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
  connectPersistOnSuccess?: boolean;
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

  const gatewayOptions = await resolveGatewayOptions({
    options,
    commandName,
    targets
  });
  const reporter = createRemoteDebugReporter({
    commandName,
    options,
    gatewayOptions,
    targets
  });
  reporter.start();

  try {
    const gateway = await connectDebugGateway({
      targets,
      options: gatewayOptions,
      onLog: (message) => reporter.log(`[gateway] ${message}`)
    });
    reporter.attachClose(({ force }) => {
      gateway.close();
      if (force) {
        process.exit(130);
      }
    });
    const source = gateway.session.sessionScope.source ?? gatewayOptions.source ?? '-';

    reporter.ready(source);

    await gateway.closed;
  } finally {
    await reporter.end();
  }
}

async function runWatchRemoteDebugSession({
  entriesInput,
  options,
  commandName
}: Omit<RemoteDebugSessionRunOptions, 'migrationHint'>): Promise<void> {
  const entries = await resolveDebugEntries(entriesInput);
  const initialTargets = await loadTargets(entries, options);
  await ensureConnectLink({
    options,
    commandName,
    targets: initialTargets
  });

  const gatewayOptions = await resolveGatewayOptions({
    options,
    commandName,
    targets: initialTargets
  });
  const reporter = createRemoteDebugReporter({
    commandName,
    options,
    gatewayOptions,
    targets: initialTargets
  });
  let reloadRunning = false;
  let reloadPending = false;
  let closed = false;
  let gateway:
    | Awaited<ReturnType<typeof connectDebugGateway>>
    | undefined;
  const reloadTargets = async () => {
    if (reloadRunning) {
      reloadPending = true;
      return;
    }

    reloadRunning = true;
    try {
      do {
        reloadPending = false;
        try {
          const nextTargets = await loadTargets(entries, options);
          gateway?.updateTargets(nextTargets);
          reporter.log(`检测到插件文件变化，已热更新 ${nextTargets.length} 个本地插件。`);
        } catch (error) {
          reporter.log(`插件热更新失败: ${formatConnectionKeyExchangeError(error)}`);
        }
      } while (reloadPending && !closed);
    } finally {
      reloadRunning = false;
    }
  };
  const watcher = watchDebugEntries(entries, () => {
    void reloadTargets();
  });

  reporter.start();

  try {
    const connectedGateway = await connectDebugGateway({
      targets: initialTargets,
      options: gatewayOptions,
      onLog: (message) => reporter.log(`[gateway] ${message}`)
    });
    gateway = connectedGateway;
    reporter.attachClose(({ force }) => {
      closed = true;
      watcher.close();
      connectedGateway.close();
      if (force) {
        process.exit(130);
      }
    });
    const source = connectedGateway.session.sessionScope.source ?? gatewayOptions.source ?? '-';
    reporter.ready(source);

    await connectedGateway.closed;
  } finally {
    closed = true;
    watcher.close();
    await reporter.end();
  }
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
    mode: 'FastGPT connection key',
    gateway: gatewayOptions.gatewayUrl,
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

  const savedConnect = await readSavedConnectionKey();
  if (savedConnect) {
    options.connect = savedConnect;
    options.connectPersistOnSuccess = true;
    logger.info(`已读取本地 FastGPT connection key 配置: ${getCliConfigPath()}`);
    return;
  }

  if (options.interactive === false || !process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('dev 需要 --connect，或在交互式终端中输入 FastGPT connection key。');
  }

  const connectUrl = await promptConnectLink({
    commandName,
    targets
  });
  options.connect = connectUrl;
  options.connectPersistOnSuccess = true;
}

async function promptConnectLink({
  commandName,
  targets,
  defaultValue,
  errorMessage
}: {
  commandName: string;
  targets: DebugGatewayTarget[];
  defaultValue?: string;
  errorMessage?: string;
}): Promise<string> {
  process.stdout.write(
    [
      '\x1b[?25h\x1b[2J\x1b[HFastGPT Plugin Dev',
      '',
      `Command   fastgpt-plugin ${commandName}`,
      'Mode      waiting for FastGPT connection key',
      'Status    pending',
      '',
      'Plugins',
      ...targets.map((target) => `  ${target.snapshot.pluginId}@${target.snapshot.version}`),
      '',
      ...(errorMessage ? [`Last error ${errorMessage}`, ''] : []),
      'Paste the FastGPT connection key or connect link to start the WSS debug session.',
      ''
    ].join('\n')
  );

  const connectUrl = await input({
    message: 'FastGPT connection key',
    default: defaultValue,
    prefill: defaultValue ? 'editable' : undefined,
    validate(value) {
      return value.trim().length > 0 || '请输入 FastGPT connection key';
    }
  });

  return connectUrl.trim();
}

async function readSavedConnectionKey(): Promise<string | undefined> {
  const config = await readCliConfig();
  const connectionKey = config.debug?.connectionKey?.trim();
  return connectionKey || undefined;
}

async function saveConnectionKey(connectionKey: string): Promise<void> {
  const trimmed = connectionKey.trim();
  if (!trimmed) {
    return;
  }

  const configPath = getCliConfigPath();
  const config = await readCliConfig();
  const nextConfig: CliConfig = {
    ...config,
    debug: {
      ...config.debug,
      connectionKey: trimmed
    }
  };

  await fsp.mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 });
  await fsp.writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, {
    encoding: 'utf-8',
    mode: 0o600
  });
}

async function readCliConfig(): Promise<CliConfig> {
  const configPath = getCliConfigPath();
  let raw: string;
  try {
    raw = await fsp.readFile(configPath, 'utf-8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }

  if (!raw.trim()) {
    return {};
  }

  return CliConfigSchema.parse(JSON.parse(raw));
}

function getCliConfigPath(): string {
  return path.join(getCliConfigDir(), CLI_CONFIG_FILE_NAME);
}

function getCliConfigDir(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME?.trim();
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, CLI_CONFIG_DIR_NAME);
  }

  return path.join(os.homedir(), '.config', CLI_CONFIG_DIR_NAME);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function formatTargetLine(snapshot: DebugPluginSnapshot): string {
  const tools = snapshot.tools.map((tool) => tool.id).join(', ') || '-';
  return `    - ${snapshot.pluginId}@${snapshot.version} tools=[${tools}] entry=${snapshot.entryDir}`;
}

type RemoteDebugReporterSummary = {
  commandName: string;
  mode: string;
  gateway: string;
  reconnect: string;
  targets: DebugPluginSnapshot[];
};

type RemoteDebugReporter = {
  start(): void;
  log(message: string): void;
  ready(source: string): void;
  attachClose(close: RemoteDebugCloseHandler): void;
  end(): Promise<void> | void;
};

type RemoteDebugCloseOptions = {
  force: boolean;
};

type RemoteDebugCloseHandler = (options: RemoteDebugCloseOptions) => void;

const CLI_CONFIG_FILE_NAME = 'config.json';
const CLI_CONFIG_DIR_NAME = 'fastgpt-plugin';

const CliConfigSchema = z
  .object({
    debug: z
      .object({
        connectionKey: z.string().min(1).optional()
      })
      .optional()
  })
  .passthrough();

type CliConfig = z.infer<typeof CliConfigSchema>;

class PlainRemoteDebugReporter implements RemoteDebugReporter {
  constructor(private readonly summary: RemoteDebugReporterSummary) {}

  start(): void {
    logger.info(
      [
        'FastGPT 插件开发会话',
        `  command: fastgpt-plugin ${this.summary.commandName}`,
        `  mode: ${this.summary.mode}`,
        '  ui: plain',
        `  gateway: ${this.summary.gateway}`,
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
  private logs: TuiLogEntry[] = [];
  private instance: Instance | undefined;
  private closeSession: RemoteDebugCloseHandler | undefined;
  private interruptCount = 0;
  private readonly onSigint = () => {
    this.requestClose('ctrl-c');
  };
  private readonly requestClose = (reason: TuiQuitReason) => {
    if (reason === 'q') {
      this.log('收到退出指令，正在关闭远程调试会话。');
      this.closeSession?.({ force: false });
      return;
    }
    this.interruptCount += 1;
    const force = this.interruptCount >= 2;
    this.status = force ? 'closed' : 'closing';
    this.log(force ? '再次收到 Ctrl+C，正在强制退出。' : '收到 Ctrl+C，正在关闭远程调试会话。再次按 Ctrl+C 强制退出。');
    this.closeSession?.({ force });
    if (force && !this.closeSession) {
      process.exit(130);
    }
  };

  constructor(private readonly summary: RemoteDebugReporterSummary) {}

  start(): void {
    process.on('SIGINT', this.onSigint);
    this.instance = renderInk(this.createApp(), {
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
      exitOnCtrlC: false,
      interactive: true,
      patchConsole: false
    });
  }

  log(message: string): void {
    this.logs.push({
      at: new Date(),
      message
    });
    this.logs = this.logs.slice(-6);
    this.rerender();
  }

  ready(source: string): void {
    this.status = 'connected';
    this.source = source;
    this.log(`远程调试已就绪，挂载 ${this.summary.targets.length} 个插件。`);
  }

  attachClose(close: RemoteDebugCloseHandler): void {
    this.closeSession = close;
  }

  async end(): Promise<void> {
    process.off('SIGINT', this.onSigint);
    this.status = 'closed';
    this.rerender();
    const instance = this.instance;
    this.instance = undefined;
    if (instance) {
      await Promise.race([instance.waitUntilRenderFlush(), delay(50)]).catch(() => undefined);
      instance.unmount();
      await Promise.race([instance.waitUntilExit(), delay(50)]).catch(() => undefined);
    }
    logger.info('远程调试会话已结束。');
  }

  private rerender(): void {
    this.instance?.rerender(this.createApp());
  }

  private createApp(): React.ReactElement {
    return React.createElement(RemoteDebugInkApp, {
      summary: this.summary,
      status: this.status,
      source: this.source,
      logs: this.logs,
      onQuit: this.requestClose
    });
  }
}

type TuiQuitReason = 'ctrl-c' | 'q';

type TuiLogEntry = {
  at: Date;
  message: string;
};

type RemoteDebugInkAppProps = {
  summary: RemoteDebugReporterSummary;
  status: string;
  source: string;
  logs: TuiLogEntry[];
  onQuit(reason: TuiQuitReason): void;
};

function RemoteDebugInkApp({
  summary,
  status,
  source,
  logs,
  onQuit
}: RemoteDebugInkAppProps): React.ReactElement {
  useInput((inputValue, key) => {
    if (key.ctrl && inputValue === 'c') {
      onQuit('ctrl-c');
      return;
    }
    if (inputValue === 'q') {
      onQuit('q');
    }
  });

  const statusMeta = getTuiStatusMeta(status);
  const sourceLabel = source === '-' ? 'waiting for bind' : source;
  const command = `fastgpt-plugin ${summary.commandName}`;
  const rows: Array<[string, string, string?]> = [
    ['command', command],
    ['gateway', summary.gateway],
    ['source', sourceLabel],
    ['reconnect', summary.reconnect === 'on' ? 'enabled' : 'disabled']
  ];
  const plugins = summary.targets.map((target) => {
    const toolCount = target.tools.length;
    return {
      id: `${target.pluginId}:${target.version}`,
      name: `${target.pluginId}@${target.version}`,
      tools: toolCount === 1 ? '1 tool' : `${toolCount} tools`,
      entry: target.entryDir
    };
  });
  const activityItems =
    logs.length > 0
      ? logs.map((entry, index) =>
          React.createElement(
            Box,
            { key: `${entry.at.getTime()}:${index}`, flexDirection: 'row' },
            React.createElement(Text, { color: 'gray' }, formatTuiTime(entry.at)),
            React.createElement(Text, { dimColor: true }, '  │  '),
            React.createElement(Text, { wrap: 'truncate-end' }, entry.message)
          )
        )
      : [
          React.createElement(
            Text,
            { key: 'empty-log', dimColor: true },
            'waiting for gateway events'
          )
        ];

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, paddingY: 1 },
    React.createElement(
      Box,
      {
        borderStyle: 'round',
        borderColor: statusMeta.borderColor,
        paddingX: 2,
        paddingY: 1,
        flexDirection: 'column'
      },
      React.createElement(
        Box,
        { justifyContent: 'space-between' },
        React.createElement(
          Box,
          null,
          React.createElement(Text, { bold: true, color: 'cyanBright' }, 'FastGPT Plugin Dev'),
          React.createElement(Text, { dimColor: true }, '  remote debug')
        ),
        React.createElement(
          Box,
          null,
          React.createElement(Text, { color: statusMeta.color, bold: true }, statusMeta.label),
          React.createElement(Text, { dimColor: true }, `  ${plugins.length} plugins`)
        )
      ),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Text, { color: statusMeta.color }, statusMeta.marker),
        React.createElement(Text, { dimColor: true }, '  '),
        React.createElement(Text, { wrap: 'truncate-end' }, statusMeta.description)
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1, columnGap: 1 },
      React.createElement(
        Box,
        {
          borderStyle: 'round',
          borderColor: 'gray',
          paddingX: 1,
          paddingY: 1,
          flexDirection: 'column',
          width: '50%'
        },
        React.createElement(Text, { bold: true }, 'Session'),
        React.createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          ...rows.map(([label, value]) =>
            React.createElement(SessionRow, {
              key: label,
              label,
              value
            })
          )
        )
      ),
      React.createElement(
        Box,
        {
          borderStyle: 'round',
          borderColor: 'gray',
          paddingX: 1,
          paddingY: 1,
          flexDirection: 'column',
          width: '50%'
        },
        React.createElement(
          Box,
          { justifyContent: 'space-between' },
          React.createElement(Text, { bold: true }, 'Plugins'),
          React.createElement(Text, { dimColor: true }, `${plugins.length} mounted`)
        ),
        React.createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          ...plugins.map((plugin, index) =>
            React.createElement(
              Box,
              { key: plugin.id, flexDirection: 'column', marginTop: index === 0 ? 0 : 1 },
              React.createElement(
                Box,
                null,
                React.createElement(Text, { color: 'greenBright' }, '● '),
                React.createElement(Text, { bold: true, wrap: 'truncate-end' }, plugin.name),
                React.createElement(Text, { dimColor: true }, `  ${plugin.tools}`)
              ),
              React.createElement(Text, { dimColor: true, wrap: 'truncate-end' }, `  ${plugin.entry}`)
            )
          )
        )
      )
    ),
    React.createElement(
      Box,
      {
        borderStyle: 'round',
        borderColor: 'gray',
        paddingX: 1,
        paddingY: 1,
        flexDirection: 'column',
        marginTop: 1
      },
      React.createElement(
        Box,
        { justifyContent: 'space-between' },
        React.createElement(Text, { bold: true }, 'Activity'),
        React.createElement(Text, { dimColor: true }, 'latest 6 events')
      ),
      React.createElement(
        Box,
        { flexDirection: 'column', marginTop: 1 },
        ...activityItems
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1, justifyContent: 'space-between' },
      React.createElement(Text, { dimColor: true }, 'q stop'),
      React.createElement(Text, { dimColor: true }, 'Ctrl+C stop · second Ctrl+C force exit')
    )
  );
}

type TuiStatusMeta = {
  label: string;
  marker: string;
  description: string;
  color: string;
  borderColor: string;
};

function getTuiStatusMeta(status: string): TuiStatusMeta {
  if (status === 'connected') {
    return {
      label: 'CONNECTED',
      marker: '●',
      description: 'Gateway channel is live and ready to receive FastGPT invocations.',
      color: 'greenBright',
      borderColor: 'green'
    };
  }

  if (status === 'closed') {
    return {
      label: 'CLOSED',
      marker: '■',
      description: 'Remote debug session has been closed.',
      color: 'gray',
      borderColor: 'gray'
    };
  }

  if (status === 'closing') {
    return {
      label: 'CLOSING',
      marker: '◆',
      description: 'Closing gateway channel. Press Ctrl+C again to force exit.',
      color: 'yellowBright',
      borderColor: 'yellow'
    };
  }

  return {
    label: 'CONNECTING',
    marker: '◆',
    description: 'Binding local plugins to the FastGPT connection gateway.',
    color: 'yellowBright',
    borderColor: 'yellow'
  };
}

function SessionRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return React.createElement(
    Box,
    null,
    React.createElement(Text, { color: 'gray' }, label.padEnd(10)),
    React.createElement(Text, { wrap: 'truncate-end' }, value)
  );
}

function formatTuiTime(value: Date): string {
  return [
    value.getHours().toString().padStart(2, '0'),
    value.getMinutes().toString().padStart(2, '0'),
    value.getSeconds().toString().padStart(2, '0')
  ].join(':');
}

async function resolveGatewayOptions({
  options,
  commandName,
  targets
}: {
  options: RemoteDebugCommandOptions;
  commandName: string;
  targets: DebugGatewayTarget[];
}): Promise<DebugGatewayClientOptions> {
  if (!options.connect) {
    throw new Error('dev 需要 --connect 来建立远程调试通道。');
  }

  while (true) {
    try {
      const gatewayOptions = await resolveConnectGatewayOptions(options);
      if (options.connectPersistOnSuccess === true) {
        await saveConnectionKey(options.connect);
        logger.info(`已保存 FastGPT connection key 到本地配置: ${getCliConfigPath()}`);
        options.connectPersistOnSuccess = false;
      }
      return gatewayOptions;
    } catch (error) {
      const errorMessage = formatConnectionKeyExchangeError(error);
      if (!canPromptForConnectInput(options)) {
        throw error;
      }

      logger.error(errorMessage);
      const nextConnect = await promptConnectLink({
        commandName,
        targets,
        defaultValue: options.connect,
        errorMessage
      });
      options.connect = nextConnect;
      options.connectPersistOnSuccess = true;
    }
  }
}

function canPromptForConnectInput(options: RemoteDebugCommandOptions): boolean {
  return (
    options.interactive !== false && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY)
  );
}

function formatConnectionKeyExchangeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function resolveConnectGatewayOptions(
  options: RemoteDebugCommandOptions
): Promise<DebugGatewayClientOptions> {
  const info = await exchangeConnectLink(options.connect as string);

  return {
    gatewayUrl: normalizeGatewayWsUrl(info.gatewayUrl),
    connectToken: info.connectToken,
    userId: info.tmbId,
    source: info.source,
    tokenTtlMs: Math.max(1, info.expiresAt - Date.now()),
    reconnect: options.noReconnect ? false : options.reconnect ?? true,
    reconnectIntervalMs: toPositiveInt(
      options.reconnectIntervalMs ?? process.env.CONNECTION_GATEWAY_RECONNECT_INTERVAL_MS ?? '2000',
      'reconnect-interval-ms'
    )
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
  gatewayUrl: z.string().min(1),
  transport: z.literal('websocket'),
  source: z.string().min(1),
  connectToken: z.string().min(1),
  expiresAt: z.number().int().positive()
});

async function exchangeConnectLink(connectInput: string) {
  const response = isHttpUrl(connectInput)
    ? await fetch(connectInput)
    : await fetch(resolveConnectionKeyExchangeUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionKey: connectInput
        })
      });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`connection key 请求失败: ${response.status} ${text}`);
  }

  const payload = text ? JSON.parse(text) : {};
  const info = ConnectInfoSchema.parse(payload.data ?? payload);

  return {
    ...info,
    tmbId: parseTmbIdFromDebugSource(info.source)
  };
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveConnectionKeyExchangeUrl(): string {
  const explicit = process.env.FASTGPT_PLUGIN_DEBUG_CONNECT_URL;
  if (explicit) {
    return explicit;
  }

  const baseUrl = process.env.FASTGPT_PLUGIN_SERVER_URL ?? process.env.PLUGIN_SERVER_URL;
  if (!baseUrl) {
    throw new Error(
      '使用裸 connection key 时需要设置 FASTGPT_PLUGIN_DEBUG_CONNECT_URL 或 FASTGPT_PLUGIN_SERVER_URL。'
    );
  }

  return new URL('/api/plugin/debug-sessions/connection-key:exchange', baseUrl).toString();
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

function normalizeGatewayWsUrl(gatewayUrl: string): string {
  const parsed = new URL(gatewayUrl);
  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
    throw new Error('gatewayUrl 必须使用 ws:// 或 wss:// 协议。');
  }
  if (!parsed.hostname) {
    throw new Error('gatewayUrl 必须包含 host。');
  }

  return parsed.toString();
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
