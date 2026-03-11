import { randomUUID } from 'node:crypto';
import type {
  PluginIOMessage,
  PluginTransport,
  PluginRouter,
  PluginIOHandler,
  PluginIOContext
} from './io';

type PendingEntry = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * 基于 PluginTransport 的通用 Router 实现。
 * 同时适用于 host 侧（发起 request）和 plugin 侧（注册 handler）。
 */
export class BasePluginRouter implements PluginRouter {
  private handlers = new Map<string, PluginIOHandler>();
  private eventHandlers = new Map<string, Set<(data: unknown, ctx: PluginIOContext) => void>>();
  private pending = new Map<string, PendingEntry>();

  constructor(private readonly transport: PluginTransport) {
    transport.onMessage((msg) => this.dispatch(msg));
  }

  handle<TParams, TResult>(method: string, handler: PluginIOHandler<TParams, TResult>): void {
    this.handlers.set(method, handler as PluginIOHandler);
  }

  on<TData>(event: string, handler: (data: TData, ctx: PluginIOContext) => void): () => void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set());
    const set = this.eventHandlers.get(event)!;
    const h = handler as (data: unknown, ctx: PluginIOContext) => void;
    set.add(h);
    return () => set.delete(h);
  }

  async request<TParams, TResult>(
    method: string,
    params: TParams,
    options?: { traceId?: string; timeoutMs?: number }
  ): Promise<TResult> {
    const id = randomUUID();
    const timeoutMs = options?.timeoutMs ?? 30_000;

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, timeoutMs);

      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });

      this.transport
        .send({ id, messageType: 'request', method, params, ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}), timestamp: Date.now() })
        .catch((err) => {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        });
    });
  }

  async emit<TData>(event: string, data: TData): Promise<void> {
    await this.transport.send({
      id: randomUUID(),
      messageType: 'event',
      method: event,
      params: data,
      timestamp: Date.now()
    });
  }

  private async dispatch(msg: PluginIOMessage): Promise<void> {
    const ctx: PluginIOContext = {
      ...(msg.traceId !== undefined ? { traceId: msg.traceId } : {}),
      transportType: this.transport.transportType
    };

    // response / error → resolve/reject pending request
    if (msg.messageType === 'response' || msg.messageType === 'error') {
      const entry = this.pending.get(msg.id);
      if (entry) {
        clearTimeout(entry.timer);
        this.pending.delete(msg.id);
        if (msg.error) {
          const err = Object.assign(new Error(msg.error.message), { code: msg.error.code, stack: msg.error.stack });
          entry.reject(err);
        } else {
          entry.resolve(msg.result);
        }
      }
      return;
    }

    // request → find handler, reply with response/error
    if (msg.messageType === 'request' && msg.method) {
      const handler = this.handlers.get(msg.method);
      if (!handler) {
        await this.transport.send({
          id: msg.id, messageType: 'error',
          error: { code: 'METHOD_NOT_FOUND', message: `Method not found: ${msg.method}` },
          timestamp: Date.now()
        });
        return;
      }
      try {
        const result = await handler(msg.params, ctx);
        await this.transport.send({ id: msg.id, messageType: 'response', result, ...(msg.traceId !== undefined ? { traceId: msg.traceId } : {}), timestamp: Date.now() });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await this.transport.send({
          id: msg.id, messageType: 'error',
          error: { code: (err as any).code ?? 'HANDLER_ERROR', message: err.message, ...(err.stack !== undefined ? { stack: err.stack } : {}) },
          ...(msg.traceId !== undefined ? { traceId: msg.traceId } : {}), timestamp: Date.now()
        });
      }
      return;
    }

    // event → fan-out to listeners
    if (msg.messageType === 'event' && msg.method) {
      const handlers = this.eventHandlers.get(msg.method);
      if (handlers) {
        for (const h of handlers) h(msg.params, ctx);
      }
    }
  }
}
