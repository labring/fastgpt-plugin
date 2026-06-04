import { type ChildProcess, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { InvokeMethodEnum, type InvokeUploadFileInputType } from '@domain/ports/invoke.port';
import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';
import { failureResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';

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

    return new Promise((resolve, reject) => {
      try {
        this.process = fork(this.options.pluginPath, [], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          serialization: 'advanced',
          env: {
            RUNTIME_MODE: PluginRuntimeModeEnum.localPool
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
    const invokeSession = this.options.getInvokeSession(request.traceId);
    if (!invokeSession) {
      return Promise.reject(new Error('Invoke session not found'));
    }

    switch (request.method) {
      case InvokeMethodEnum.uploadFile: {
        return invokeSession.uploadFile({
          ...(request.args as unknown as InvokeUploadFileInputType),
          file: (await request.waitForInputStream()).stream.toReadable()
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
