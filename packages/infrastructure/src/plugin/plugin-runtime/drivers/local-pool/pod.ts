import { type ChildProcess, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';

import {
  InvokeMethodEnum,
  type InvokePort,
  type InvokeUploadFileInputType
} from '@domain/ports/invoke.port';
import type { PluginInvokeEventNameType } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginPermissionEnumType } from '@domain/value-objects/permission.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';

import type { PluginIOMessage } from '../../ports/plugin-io.port';

import {
  createChildProcessIpcChannel,
  HOST_INVOKE_METHOD,
  type PluginIpcChannel,
  type PluginIpcDuplexReplyOptions,
  type PluginIpcIncomingStream
} from './ipc-channel';
import type { PodInfo, PodStatus } from './types';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';

export interface PluginPodCallbacks {
  onReady?: (info: PodInfo) => void;
  onRequestCompleted?: (payload: { requestId: string; duration: number }) => void;
  onTimeout?: (payload: { requestId: string; method: PluginInvokeEventNameType }) => void;
  onError?: (error: Error) => void;
  onExit?: (payload: { code: number | null; signal: string | null; wasRunning: boolean }) => void;
  onStdout?: (line: string) => void;
  onStderr?: (line: string) => void;
}

export interface PluginPodOptions {
  pluginPath: string;
  podTimeout: number;
  maxRequests: number;
  /** 最大并发请求数（默认 1，I/O 密集型工具可调高） */
  maxConcurrentRequests: number;
  /** 插件声明的宿主调用权限 */
  pluginPermissions: PluginPermissionEnumType[];
  callbacks?: PluginPodCallbacks;
  invokeManager: InvokePort;
}

export interface PluginPodClientRequestContext {
  requestId: string;
  method: string;
  args: unknown;
  traceId?: string;
  permissions: PluginPermissionEnumType[];
  waitForInputStream: <T = unknown>(options?: {
    timeoutMs?: number;
  }) => Promise<PluginIpcIncomingStream<T>>;
  replyDuplex: <R = unknown, O = unknown>(
    result?: R,
    options?: PluginIpcDuplexReplyOptions<O>
  ) => unknown;
}

export interface PluginPodClientRequestPayload {
  requestId: string;
  method: string;
  args: unknown;
}

export class PluginPod {
  private process: ChildProcess | null = null;
  private channel: PluginIpcChannel | null = null;
  private status: PodStatus = 'pending';
  private requestsExecuted = 0;
  private activeRequests = 0;
  private createdAt = Date.now();
  private lastActiveAt = Date.now();

  constructor(
    public readonly podId: string,
    private options: PluginPodOptions
  ) {}

  async start(): Promise<void> {
    if (this.process) throw new Error('Pod already started');

    return new Promise((resolve, reject) => {
      try {
        this.process = fork(this.options.pluginPath, [], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          env: {
            RUNTIME_MODE: PluginRuntimeModeEnum.localPool
          }
        });

        this.channel = createChildProcessIpcChannel(this.process, {
          defaultTimeoutMs: this.options.podTimeout
        });
        this.channel.onError((error) => this.handleError(error));
        this.channel.setRequestHandler((message) => this.handleClientRequest(message));

        // 等待 ready 信号（pod 生命周期，不走 router）
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
            reject(new Error('Pod startup timeout'));
            this.kill();
          });
        }, 10_000);

        const unsubReady = this.channel.onReady((msg) => {
          if (msg.messageType === 'ready') {
            settle(() => {
              this.status = 'idle';
              this.options.callbacks?.onReady?.(this.getInfo());
              resolve();
            });
          }
        });

        this.process.on('error', (err) => this.handleError(err));
        this.process.on('exit', (code, signal) => {
          // 若 ready 尚未收到，立即 reject（不等 10 秒超时）
          settle(() => {
            reject(new Error(`Pod process exited before ready: code=${code}, signal=${signal}`));
          });
          this.handleExit(code, signal);
        });

        // 转发 stdout / stderr 输出（逐行）
        if (this.process.stdout) {
          createInterface({ input: this.process.stdout, crlfDelay: Infinity }).on(
            'line',
            (line) => {
              this.options.callbacks?.onStdout?.(line);
            }
          );
        }
        if (this.process.stderr) {
          createInterface({ input: this.process.stderr, crlfDelay: Infinity }).on(
            'line',
            (line) => {
              this.options.callbacks?.onStderr?.(line);
            }
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async invoke<P, R, S extends boolean>({
    eventName,
    payload,
    returnStream
  }: {
    eventName: PluginInvokeEventNameType;
    payload: P;
    returnStream: S;
  }): Promise<S extends true ? StreamData<R> : R> {
    if (!this.isAvailable()) {
      throw new Error(`Pod not available: ${this.status}`);
    }

    const requestId = randomUUID();
    const startedAt = Date.now();

    this.activeRequests++;
    this.status = 'running';
    this.lastActiveAt = startedAt;

    try {
      if (!this.channel) {
        throw new Error('Channel not available');
      }

      const result = returnStream
        ? await this.channel
            .requestDuplex<P, void, never, R>(eventName, payload, {
              requestId,
              timeoutMs: this.options.podTimeout
            })
            .then(({ output }) => {
              if (!output) {
                throw new Error(`Request did not return an output stream: ${eventName}`);
              }
              return output.stream;
            })
        : await this.channel.request<P, R>(eventName, payload, {
            timeoutMs: this.options.podTimeout,
            requestId
          });

      this.requestsExecuted++;
      const finishedAt = Date.now();
      this.options.callbacks?.onRequestCompleted?.({
        requestId,
        duration: finishedAt - startedAt
      });

      return result as S extends true ? StreamData<R> : R;
    } catch (error) {
      if (isRequestTimeoutError(error)) {
        this.options.callbacks?.onTimeout?.({ requestId, method: eventName });
      }
      this.status = 'failed';
      this.kill();
      throw error;
    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.lastActiveAt = Date.now();

      if (this.process && this.status === 'running') {
        this.status = this.activeRequests > 0 ? 'running' : 'idle';
      }
    }
  }

  private handleError(error: Error): void {
    this.status = 'failed';
    void this.channel?.close(error);
    this.options.callbacks?.onError?.(error);
  }

  private handleExit(code: number | null, signal: string | null): void {
    const wasRunning = ['running', 'idle'].includes(this.status) || this.activeRequests > 0;
    void this.channel?.close(
      new Error(`Pod process exited: code=${String(code)}, signal=${String(signal)}`)
    );
    this.status = 'failed';
    this.options.callbacks?.onExit?.({ code, signal, wasRunning });
    this.channel = null;
    this.process = null;
  }

  kill(signal: NodeJS.Signals = 'SIGTERM'): void {
    if (this.process) {
      this.status = 'terminating';
      this.process.kill(signal);
    }
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
      this.status === 'idle' &&
      this.activeRequests < this.options.maxConcurrentRequests &&
      this.requestsExecuted < this.options.maxRequests
    );
  }
  getIdleTime(): number {
    return this.activeRequests === 0 && this.status === 'idle' ? Date.now() - this.lastActiveAt : 0;
  }

  /** 即时更新最大并发槽数 */
  updateMaxConcurrentRequests(n: number): void {
    this.options.maxConcurrentRequests = n;
  }

  private async handleClientRequest(message: PluginIOMessage): Promise<unknown> {
    if (message.method !== HOST_INVOKE_METHOD) {
      throw Object.assign(new Error(`Method not found: ${message.method}`), {
        code: 'METHOD_NOT_FOUND'
      });
    }

    return this.routeClientRequest(this.createClientRequestContext(message));
  }

  private createClientRequestContext(message: PluginIOMessage): PluginPodClientRequestContext {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    const { requestId, method, args } = message.params as PluginPodClientRequestPayload;

    if (!requestId) {
      throw Object.assign(new Error('Client requestId is required'), {
        code: 'INVALID_REQUEST'
      });
    }

    if (!method) {
      throw Object.assign(new Error('Client request method is required'), {
        code: 'INVALID_REQUEST'
      });
    }

    return {
      requestId,
      method,
      args,
      traceId: message.traceId,
      permissions: this.options.pluginPermissions,
      waitForInputStream: <T = unknown>(options?: { timeoutMs?: number }) =>
        this.channel!.waitForRequestInputStream<T>(message, options),
      replyDuplex: <R = unknown, O = unknown>(
        result?: R,
        options?: PluginIpcDuplexReplyOptions<O>
      ) => this.channel!.replyDuplex(message, result, options)
    };
  }

  /**
   * client -> host 请求的统一接入点。
   * 后续如果要在 pod 内直接实现或引入独立 handler，就从这里接入。
   */
  private async routeClientRequest(request: PluginPodClientRequestContext): Promise<unknown> {
    switch (request.method) {
      case InvokeMethodEnum.uploadFile: {
        return this.options.invokeManager.uploadFile({
          ...(request.args as unknown as InvokeUploadFileInputType),
          file: (await request.waitForInputStream()).stream.toReadable()
        });
      }
    }

    return Promise.reject(`Method not found: ${request.method}`);
  }
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
