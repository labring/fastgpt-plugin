import { fork, spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { BasePluginRouter } from '@fastgpt-plugin/helpers/common/router';
import type { PluginIOMessage, PluginTransport } from '@fastgpt-plugin/helpers/common/io';
import type { PodStatus, PodInfo } from './types';

export interface PluginPodOptions {
  pluginPath: string;
  podTimeout: number;
  maxRequests: number;
  /** 最大并发请求数（默认 1，I/O 密集型工具可调高） */
  maxConcurrentRequests: number;
  /** 处理来自子进程的反向调用请求（method + args → result） */
  onHostCallback?: (token: string, method: string, params: unknown) => Promise<unknown>;
}

/**
 * Host 侧 IPC transport，包装一个 ChildProcess 的 IPC channel。
 */
class HostIpcTransport implements PluginTransport {
  readonly transportType = 'ipc' as const;

  constructor(private readonly process: ChildProcess) {}

  async send(message: PluginIOMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process.send) {
        reject(new Error('IPC channel not available'));
        return;
      }
      this.process.send(message, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onMessage(handler: (message: PluginIOMessage) => void): () => void {
    const listener = (msg: unknown) => {
      if (msg && typeof msg === 'object' && 'messageType' in msg) {
        handler(msg as PluginIOMessage);
      }
    };
    this.process.on('message', listener);
    return () => this.process.off('message', listener);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

export class PluginPod extends EventEmitter {
  private process: ChildProcess | null = null;
  private transport: HostIpcTransport | null = null;
  private router: BasePluginRouter | null = null;
  private status: PodStatus = 'pending';
  private requestsExecuted = 0;
  private activeRequests = 0;
  private createdAt = Date.now();
  private lastActiveAt = Date.now();

  constructor(
    public readonly podId: string,
    private options: PluginPodOptions
  ) {
    super();
  }

  async start(): Promise<void> {
    if (this.process) throw new Error('Pod already started');

    return new Promise((resolve, reject) => {
      try {
        const isTypeScript = this.options.pluginPath.endsWith('.ts');
        this.process = isTypeScript
          ? spawn('node', ['--import', 'tsx/esm', this.options.pluginPath], {
              stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            })
          : fork(this.options.pluginPath, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

        this.transport = new HostIpcTransport(this.process);
        this.router = new BasePluginRouter(this.transport);

        // 注册反向调用 handler（子进程 → Host）
        if (this.options.onHostCallback) {
          this.router.handle('hostCallback', async (params: unknown) => {
            const { callbackToken, method, args } = params as {
              callbackToken: string;
              method: string;
              args: unknown;
            };
            return this.options.onHostCallback!(callbackToken, method, args);
          });
        }

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

        const unsubReady = this.transport.onMessage((msg) => {
          if (msg.messageType === 'ready') {
            settle(() => {
              this.status = 'idle';
              this.emit('ready', this.getInfo());
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
              this.emit('stdout', line);
            }
          );
        }
        if (this.process.stderr) {
          createInterface({ input: this.process.stderr, crlfDelay: Infinity }).on(
            'line',
            (line) => {
              this.emit('stderr', line);
            }
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async invoke(
    method: string,
    params: unknown,
    options?: { timeout?: number; traceId?: string }
  ): Promise<unknown> {
    if (!this.isAvailable()) {
      throw new Error(`Pod not available: ${this.status}`);
    }

    this.activeRequests++;
    this.lastActiveAt = Date.now();

    try {
      const result = await this.router!.request(method, params, {
        timeoutMs: options?.timeout ?? this.options.podTimeout,
        traceId: options?.traceId
      });
      this.requestsExecuted++;
      this.activeRequests--;
      this.lastActiveAt = Date.now();
      this.emit('requestCompleted', {
        requestId: randomUUID(),
        duration: Date.now() - this.lastActiveAt
      });
      return result;
    } catch (error) {
      this.activeRequests--;
      this.status = 'failed';
      this.kill();
      throw error;
    }
  }

  private handleError(error: Error): void {
    this.status = 'failed';
    this.emit('error', error);
  }

  private handleExit(code: number | null, signal: string | null): void {
    const wasRunning = ['running', 'busy', 'idle'].includes(this.status);
    this.status = 'failed';
    this.emit('exit', { code, signal, wasRunning });
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
}
