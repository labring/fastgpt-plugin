import { fork, spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { BasePluginRouter } from '@fastgpt-plugin/helpers/common/router';
import type { PluginIOMessage, PluginTransport } from '@fastgpt-plugin/helpers/common/io';
import type { PodStatus, PodInfo } from './types';

export interface PluginPodOptions {
  pluginPath: string;
  podTimeout: number;
  maxRequests: number;
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
          ? spawn('node', ['--import', 'tsx/esm', this.options.pluginPath], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })
          : fork(this.options.pluginPath, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

        this.transport = new HostIpcTransport(this.process);
        this.router = new BasePluginRouter(this.transport);

        // 等待 ready 信号（pod 生命周期，不走 router）
        const readyTimeout = setTimeout(() => {
          reject(new Error('Pod startup timeout'));
          this.kill();
        }, 10_000);

        const unsubReady = this.transport.onMessage((msg) => {
          if (msg.messageType === 'ready') {
            clearTimeout(readyTimeout);
            unsubReady();
            this.status = 'idle';
            this.emit('ready', this.getInfo());
            resolve();
          }
        });

        this.process.on('error', (err) => this.handleError(err));
        this.process.on('exit', (code, signal) => this.handleExit(code, signal));
      } catch (error) {
        reject(error);
      }
    });
  }

  async invoke(method: string, params: unknown, options?: { timeout?: number; traceId?: string }): Promise<unknown> {
    if (!this.isAvailable()) {
      throw new Error(`Pod not available: ${this.status}`);
    }

    this.status = 'busy';
    this.lastActiveAt = Date.now();

    try {
      const result = await this.router!.request(method, params, {
        timeoutMs: options?.timeout ?? this.options.podTimeout,
        traceId: options?.traceId
      });
      this.requestsExecuted++;
      this.status = 'idle';
      this.lastActiveAt = Date.now();
      this.emit('requestCompleted', { requestId: randomUUID(), duration: Date.now() - this.lastActiveAt });
      return result;
    } catch (error) {
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
      createdAt: this.createdAt,
      lastActiveAt: this.lastActiveAt,
      pid: this.process?.pid
    };
  }

  isIdle(): boolean { return this.status === 'idle'; }
  isBusy(): boolean { return this.status === 'busy'; }
  isAvailable(): boolean { return this.status === 'idle' && this.requestsExecuted < this.options.maxRequests; }
  getIdleTime(): number { return this.status === 'idle' ? Date.now() - this.lastActiveAt : 0; }
}
