import { type ChildProcess, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

import { InvokeMethodEnum, type InvokeUploadFileInputType } from '@domain/ports/invoke.port';
import { getInvokeMethodPermission } from '@domain/ports/invoke-permission';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { failureResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { env } from '@infrastructure/env';

import {
  PluginChannelClientMethod,
  PluginChannelHostMethod,
  type PluginChannelIncomingStream,
  type PluginChannelReceivedRequestContext,
  type PluginRuntimeChannelPort
} from '../../../ports/channel';
import { createChildProcessPluginChannel } from '../../channel/ipc';

import type {
  PluginPodClientRequestContext,
  PluginPodInvokeInput,
  PluginPodOptions,
  PodInfo,
  PodStatus
} from './type';

export type {
  PluginPodCallbacks,
  PluginPodClientRequestContext,
  PluginPodInvokeInput,
  PluginPodOptions,
  PodInfo,
  PodStatus
} from './type';

export const POD_STARTUP_TIMEOUT_CODE = 'POD_STARTUP_TIMEOUT';
const DEFAULT_MAX_OLD_SPACE_SIZE_MB = 512;
const DEFAULT_TERMINATION_GRACE_PERIOD = 5_000;

export type PodStartupTimeoutError = Error & {
  code: typeof POD_STARTUP_TIMEOUT_CODE;
};

export function isPodStartupTimeoutError(error: unknown): error is PodStartupTimeoutError {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as Error & { code?: string }).code === POD_STARTUP_TIMEOUT_CODE
  );
}

export class PluginPod {
  private process: ChildProcess | null = null;
  private channel: PluginRuntimeChannelPort<'host'> | null = null;
  private forceKillTimer: NodeJS.Timeout | null = null;
  private runtimeDirectory: string | null = null;
  private status: PodStatus = 'pending';
  private requestsExecuted = 0;
  private activeRequests = 0;
  private createdAt = Date.now();
  private lastActiveAt = Date.now();

  constructor(
    public readonly podId: string,
    private options: PluginPodOptions
  ) { }

  async start(): Promise<void> {
    if (this.process) throw new Error('Pod already started');

    const runtime = await this.prepareRuntime();

    return new Promise((resolve, reject) => {
      try {
        this.process = fork(runtime.pluginPath, [], {
          cwd: runtime.pluginDirectory,
          detached: process.platform !== 'win32',
          execArgv: runtime.execArgv,
          stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
          serialization: 'advanced',
          env: {
            HOME: runtime.homeDirectory,
            RUNTIME_MODE: PluginRuntimeModeEnum.localPool,
            TEMP: runtime.tempDirectory,
            TMP: runtime.tempDirectory,
            TMPDIR: runtime.tempDirectory
          }
        });

        this.channel = createChildProcessPluginChannel(this.process, {
          defaultTimeoutMs: this.options.podTimeout
        });
        this.channel.onError((error) => this.handleError(error));
        this.channel.setRequestHandler((message) => this.handleClientRequest(message));

        let settled = false;
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(readyTimeout);
          unsubReady();
          fn();
        };

        const readyTimeout = setTimeout(() => {
          settle(() => {
            reject(createPodStartupTimeoutError());
            this.kill();
          });
        }, 10_000);

        const activeChannel = this.channel;
        activeChannel.setNotificationHandler((notification) => {
          if (notification.method === PluginChannelClientMethod.ready) {
            settle(() => {
              this.status = 'idle';
              this.options.callbacks?.onReady?.(this.getInfo());
              resolve();
            });
            return;
          }

          if (notification.method === PluginChannelClientMethod.stdio) {
            const { stream, chunk } = notification.params;
            if (stream === 'stdout') {
              this.options.callbacks?.onStdout?.(chunk);
              return;
            }
            this.options.callbacks?.onStderr?.(chunk);
            return;
          }

          if (notification.method === PluginChannelClientMethod.fail) {
            this.handleError(
              new Error(notification.params.error?.message ?? notification.params.reason)
            );
          }
        });

        const unsubReady = () => { };

        this.process.on('error', (err) => this.handleError(err));
        this.process.on('exit', (code, signal) => {
          settle(() => {
            reject(new Error(`Pod process exited before ready: code=${code}, signal=${signal}`));
          });
          this.handleExit(code, signal);
        });

        if (this.process.stdout) {
          this.process.stdout.setEncoding('utf8');
          this.process.stdout.on('data', (chunk: string) => {
            this.options.callbacks?.onStdout?.(chunk);
          });
        }
        if (this.process.stderr) {
          this.process.stderr.setEncoding('utf8');
          this.process.stderr.on('data', (chunk: string) => {
            this.options.callbacks?.onStderr?.(chunk);
          });
        }
      } catch (error) {
        if (this.process) {
          this.sendSignal(this.process, 'SIGKILL');
        }
        void this.cleanupRuntimeDirectory().catch(() => {});
        reject(error);
      }
    });
  }

  async invoke<P, R, S extends boolean>(
    input: PluginPodInvokeInput<P, S>
  ): Promise<S extends true ? StreamData<R> : R> {
    const { eventName, payload, returnStream, options } = input;

    if (!this.isAvailable()) {
      throw new Error(`Pod not available: ${this.status}`);
    }

    const requestId = randomUUID();
    const startedAt = Date.now();
    let streamTransferred = false;

    this.activeRequests++;
    this.status = 'running';
    this.lastActiveAt = startedAt;

    try {
      if (!this.channel) {
        throw new Error('Channel not available');
      }

      const result = returnStream
        ? await this.channel
          .request(
            PluginChannelHostMethod.request,
            {
              eventName,
              payload,
              returnStream
            },
            {
              id: requestId,
              timeoutMs: options?.timeout ?? this.options.podTimeout,
              traceId: options?.invocationId
            }
          )
          .then(({ output }) => {
            if (!output) {
              throw new Error(`Request did not return an output stream: ${eventName}`);
            }
            return output.stream;
          })
        : await this.channel
          .request(
            PluginChannelHostMethod.request,
            {
              eventName,
              payload,
              returnStream
            },
            {
              timeoutMs: options?.timeout ?? this.options.podTimeout,
              id: requestId,
              traceId: options?.invocationId
            }
          )
          .then(({ result }) => result as R);

      this.requestsExecuted++;
      const finishedAt = Date.now();
      this.options.callbacks?.onRequestCompleted?.({
        requestId,
        duration: finishedAt - startedAt
      });

      if (result instanceof StreamData) {
        streamTransferred = true;
        return result as S extends true ? StreamData<R> : R;
      }

      return result as S extends true ? StreamData<R> : R;
    } catch (error) {
      const err = isRequestTimeoutError(error) ? createPluginInvokeTimeoutError({
        source: error,
        requestId,
        eventName,
        timeoutMs: options?.timeout ?? this.options.podTimeout
      }) : error
      this.options.callbacks?.onTimeout?.({ requestId, method: eventName });
      this.status = 'failed';
      this.kill();
      throw err;
    } finally {
      if (!streamTransferred) {
        this.completeRequest();
      }
    }
  }

  completeStreamRequest(): void {
    this.completeRequest();
  }

  kill(signal: NodeJS.Signals = 'SIGTERM'): void {
    const child = this.process;
    if (!child) {
      return;
    }

    this.status = 'terminating';
    this.sendSignal(child, signal);

    if (signal === 'SIGKILL') {
      this.clearForceKillTimer();
      return;
    }

    if (this.forceKillTimer) {
      return;
    }

    const gracePeriod = this.options.terminationGracePeriod ?? DEFAULT_TERMINATION_GRACE_PERIOD;
    this.forceKillTimer = setTimeout(() => {
      this.forceKillTimer = null;
      this.sendSignal(child, 'SIGKILL');
      if (!this.process) {
        void this.cleanupRuntimeDirectory().catch(() => {});
      }
    }, gracePeriod);
    this.forceKillTimer.unref?.();
  }

  getInfo(): PodInfo {
    return {
      podId: this.podId,
      status: this.status,
      requestsExecuted: this.requestsExecuted,
      activeRequests: this.activeRequests,
      createdAt: this.createdAt,
      lastActiveAt: this.lastActiveAt,
      pid: this.process?.pid
    };
  }

  isIdle(): boolean {
    return this.status === 'idle' && this.activeRequests === 0;
  }

  isBusy(): boolean {
    return this.activeRequests > 0;
  }

  isAvailable(): boolean {
    return (
      (this.status === 'idle' || this.status === 'running') &&
      this.activeRequests < this.options.maxConcurrentRequests &&
      this.requestsExecuted < this.options.maxRequests
    );
  }

  getIdleTime(): number {
    return this.activeRequests === 0 && this.status === 'idle' ? Date.now() - this.lastActiveAt : 0;
  }

  updateMaxConcurrentRequests(n: number): void {
    this.options.maxConcurrentRequests = n;
  }

  private completeRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.lastActiveAt = Date.now();

    if (this.process && this.status === 'running') {
      this.status = this.activeRequests > 0 ? 'running' : 'idle';
    }
  }

  private handleError(error: Error): void {
    this.status = 'failed';
    void this.channel?.close(error);
    this.options.callbacks?.onError?.(error);
    this.kill();
  }

  private handleExit(code: number | null, signal: string | null): void {
    const child = this.process;
    const waitForProcessGroup =
      Boolean(this.forceKillTimer) && Boolean(child && this.isProcessGroupAlive(child));
    if (!waitForProcessGroup) {
      this.clearForceKillTimer();
    }
    const wasRunning = ['running', 'idle'].includes(this.status) || this.activeRequests > 0;
    void this.channel?.close(
      new Error(`Pod process exited: code=${String(code)}, signal=${String(signal)}`)
    );
    this.status = 'failed';
    this.options.callbacks?.onExit?.({ code, signal, wasRunning });
    this.channel = null;
    this.process = null;
    if (!waitForProcessGroup) {
      void this.cleanupRuntimeDirectory().catch(() => {});
    }
  }

  private async handleClientRequest(
    message: PluginChannelReceivedRequestContext<'host'>
  ): Promise<unknown> {
    return this.routeClientRequest(this.createClientRequestContext(message));
  }

  private createClientRequestContext(
    message: PluginChannelReceivedRequestContext<'host'>
  ): PluginPodClientRequestContext {
    const { method, args } = message.params;

    if (!method) {
      throw Object.assign(new Error('Client request method is required'), {
        code: 'INVALID_REQUEST'
      });
    }

    return {
      requestId: String(message.id),
      method,
      args,
      traceId: message.traceId,
      permissions: this.options.pluginPermissions,
      waitForInputStream: <T = unknown>(options?: { timeoutMs?: number }) =>
        message.waitForInputStream(options) as Promise<PluginChannelIncomingStream<T>>
    };
  }

  private async routeClientRequest(request: PluginPodClientRequestContext): Promise<unknown> {
    const uploadInput =
      request.method === InvokeMethodEnum.uploadFile
        ? request.waitForInputStream({ timeoutMs: this.options.podTimeout })
        : null;
    const requiredPermission = getInvokeMethodPermission(request.method);
    if (requiredPermission && !request.permissions.includes(requiredPermission)) {
      this.discardInputStream(uploadInput);
      return failureResult(
        {
          en: `Plugin permission "${requiredPermission}" is required`,
          'zh-CN': `插件需要 "${requiredPermission}" 权限`
        },
        null
      );
    }

    const invokeSession = this.options.getInvokeSession(request.traceId);
    if (!invokeSession) {
      this.discardInputStream(uploadInput);
      return Promise.reject(new Error('Invoke session not found'));
    }

    switch (request.method) {
      case InvokeMethodEnum.uploadFile: {
        return invokeSession.uploadFile({
          ...(request.args as unknown as InvokeUploadFileInputType),
          file: (await uploadInput!).stream.toReadable()
        });
      }
      case InvokeMethodEnum.userInfo: {
        return invokeSession.userInfo();
      }
      case InvokeMethodEnum.wecomCorpToken: {
        return invokeSession.getWecomCorpToken();
      }
    }
    return failureResult(
      {
        en: `Method not found: ${request.method}`,
        'zh-CN': `未找到方法: ${request.method}`
      },
      null
    );
  }

  private discardInputStream(
    input: Promise<PluginChannelIncomingStream<unknown>> | null
  ): void {
    if (!input) {
      return;
    }

    void input
      .then(({ stream }) => {
        const readable = stream.toReadable();
        readable.on('error', () => {});
        readable.resume();
      })
      .catch(() => {});
  }

  private async prepareRuntime(): Promise<{
    pluginPath: string;
    pluginDirectory: string;
    homeDirectory: string;
    tempDirectory: string;
    execArgv: string[];
  }> {
    const pluginPath = await realpath(path.resolve(this.options.pluginPath));
    const pluginDirectory = path.dirname(pluginPath);
    const configuredRuntimeDirectory = path.join(env.LOCAL_FILE_BASE_PATH, 'pods', this.podId);
    const configuredHomeDirectory = path.join(configuredRuntimeDirectory, 'home');
    const configuredTempDirectory = path.join(configuredRuntimeDirectory, 'tmp');

    await rm(configuredRuntimeDirectory, { recursive: true, force: true });
    await Promise.all([
      mkdir(configuredHomeDirectory, { recursive: true, mode: 0o700 }),
      mkdir(configuredTempDirectory, { recursive: true, mode: 0o700 })
    ]);
    const runtimeDirectory = await realpath(configuredRuntimeDirectory);
    const runtimeBaseDirectory = await realpath(env.LOCAL_FILE_BASE_PATH);
    const homeDirectory = path.join(runtimeDirectory, 'home');
    const tempDirectory = path.join(runtimeDirectory, 'tmp');
    const runtimeNodeModules = path.join(runtimeBaseDirectory, 'node_modules');
    this.runtimeDirectory = runtimeDirectory;
    const runtimeReadPaths = await collectRuntimeReadPaths(runtimeNodeModules);

    return {
      pluginPath,
      pluginDirectory,
      homeDirectory,
      tempDirectory,
      execArgv: [
        '--permission',
        `--max-old-space-size=${this.options.maxOldSpaceSizeMb ?? DEFAULT_MAX_OLD_SPACE_SIZE_MB}`,
        `--allow-fs-read=${pluginDirectory}`,
        `--allow-fs-read=${runtimeNodeModules}`,
        ...runtimeReadPaths.map((readPath) => `--allow-fs-read=${readPath}`),
        `--allow-fs-read=${runtimeDirectory}`,
        `--allow-fs-write=${runtimeDirectory}`
      ]
    };
  }

  private sendSignal(child: ChildProcess, signal: NodeJS.Signals): void {
    if (process.platform !== 'win32' && child.pid) {
      try {
        process.kill(-child.pid, signal);
        return;
      } catch {
        // Fall back to the direct child if the process group no longer exists.
      }
    }

    child.kill(signal);
  }

  private clearForceKillTimer(): void {
    if (!this.forceKillTimer) {
      return;
    }
    clearTimeout(this.forceKillTimer);
    this.forceKillTimer = null;
  }

  private isProcessGroupAlive(child: ChildProcess): boolean {
    if (process.platform === 'win32' || !child.pid) {
      return false;
    }

    try {
      process.kill(-child.pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  private async cleanupRuntimeDirectory(): Promise<void> {
    const runtimeDirectory = this.runtimeDirectory;
    this.runtimeDirectory = null;
    if (runtimeDirectory) {
      await rm(runtimeDirectory, { recursive: true, force: true });
    }
  }
}

async function collectRuntimeReadPaths(runtimeNodeModules: string): Promise<string[]> {
  const readPaths = new Set<string>();
  const runtimeSdkPath = path.join(
    runtimeNodeModules,
    '@fastgpt-plugin',
    'sdk-factory'
  );

  const resolvedRuntimeSdkPath = await addExistingReadPath(readPaths, runtimeSdkPath);
  if (!resolvedRuntimeSdkPath) {
    return [...readPaths];
  }

  await addDeclaredRuntimeDependencyReadPaths(
    resolvedRuntimeSdkPath,
    readPaths,
    new Set<string>()
  );

  return [...readPaths];
}

async function addDeclaredRuntimeDependencyReadPaths(
  packageRoot: string,
  readPaths: Set<string>,
  visitedPackageRoots: Set<string>
): Promise<void> {
  const resolvedPackageRoot = await addExistingReadPath(readPaths, packageRoot);
  if (!resolvedPackageRoot || visitedPackageRoots.has(resolvedPackageRoot)) {
    return;
  }
  visitedPackageRoots.add(resolvedPackageRoot);

  let manifest: {
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  try {
    manifest = JSON.parse(
      await readFile(path.join(resolvedPackageRoot, 'package.json'), 'utf8')
    ) as typeof manifest;
  } catch {
    return;
  }

  const dependencyNames = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {})
  ]);
  for (const dependencyName of dependencyNames) {
    const dependency = await resolveRuntimeDependency(resolvedPackageRoot, dependencyName);
    if (!dependency) {
      continue;
    }
    readPaths.add(dependency.requestPath);
    readPaths.add(dependency.resolvedPath);
    await addDeclaredRuntimeDependencyReadPaths(
      dependency.resolvedPath,
      readPaths,
      visitedPackageRoots
    );
  }
}

async function resolveRuntimeDependency(
  packageRoot: string,
  packageName: string
): Promise<{ requestPath: string; resolvedPath: string } | null> {
  const packagePathParts = getPackagePathParts(packageName);
  if (!packagePathParts) {
    return null;
  }

  let currentDirectory = packageRoot;
  while (true) {
    const requestPath = path.join(currentDirectory, 'node_modules', ...packagePathParts);
    try {
      return {
        requestPath,
        resolvedPath: await realpath(requestPath)
      };
    } catch {
      const parentDirectory = path.dirname(currentDirectory);
      if (parentDirectory === currentDirectory) {
        return null;
      }
      currentDirectory = parentDirectory;
    }
  }
}

function getPackagePathParts(packageName: string): string[] | null {
  const parts = packageName.split('/');
  const hasValidShape = packageName.startsWith('@') ? parts.length === 2 : parts.length === 1;
  return hasValidShape && parts.every((part) => part && part !== '.' && part !== '..')
    ? parts
    : null;
}

async function addExistingReadPath(
  readPaths: Set<string>,
  targetPath: string
): Promise<string | null> {
  try {
    const resolvedPath = await realpath(targetPath);
    readPaths.add(targetPath);
    readPaths.add(resolvedPath);
    return resolvedPath;
  } catch {
    return null;
  }
}

function createPodStartupTimeoutError(): PodStartupTimeoutError {
  return Object.assign(new Error('Pod startup timeout'), {
    code: POD_STARTUP_TIMEOUT_CODE as typeof POD_STARTUP_TIMEOUT_CODE
  });
}

function isRequestTimeoutError(
  error: unknown
): error is Error & { code: 'REQUEST_TIMEOUT'; requestId: string; method: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as Error & { code?: string }).code === 'REQUEST_TIMEOUT'
  );
}

function createPluginInvokeTimeoutError({
  source,
  requestId,
  eventName,
  timeoutMs
}: {
  source: Error;
  requestId: string;
  eventName: string;
  timeoutMs: number;
}): Error & { code: 'REQUEST_TIMEOUT'; requestId: string; method: string; timeoutMs: number } {
  return Object.assign(
    new Error(`Plugin invocation timed out after ${timeoutMs}ms while handling event "${eventName}"`),
    source,
    {
      code: 'REQUEST_TIMEOUT' as const,
      requestId,
      method: eventName,
      timeoutMs
    }
  );
}
