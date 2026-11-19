import type { PluginStreamAnswerType } from '@domain/value-objects/plugin-stream.vo';

import { HttpInvokeClient } from './http-invoke.client';
import type { DefinedToolFactory } from './index';

export type WorkerRuntimeOptions = {
  /** Trusted deployment configuration; never taken from an invocation payload. */
  invokeGatewayUrl: string;
  fetch?: typeof fetch;
};

/** Adapts the existing tool factory without loading IPC or Node stream implementations. */
export function createWorkerRuntime(
  tool: Pick<DefinedToolFactory, 'getToolHandler' | 'getSecretSchema'>,
  options: WorkerRuntimeOptions
) {
  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method !== 'POST') {
        return Response.json({ code: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } });
      }
      if (!new URL(request.url).pathname.endsWith('/run')) {
        return Response.json({ code: 'EVENT_NOT_SUPPORTED' }, { status: 404 });
      }

      let payload: Record<string, unknown>;
      let identity: { tenantId: string; pluginId: string };
      try {
        identity = resolveWorkerIdentity(request.url);
        const logicalPluginId = request.headers.get('x-fastgpt-plugin-id');
        if (logicalPluginId) identity.pluginId = decodeURIComponent(logicalPluginId);
        const body: unknown = await request.json();
        if (!isRecord(body) || !isRecord(body.payload)) throw new Error('Invalid request payload');
        payload = body.payload;
        if (payload.childId !== undefined && typeof payload.childId !== 'string') {
          throw new Error('Invalid childId');
        }
        if (!isRecord(payload.input) || !isRecord(payload.systemVar)) {
          throw new Error('Invalid tool input or system variables');
        }
      } catch {
        return Response.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      }

      const handler = payload.childId === undefined
        ? tool.getToolHandler()
        : tool.getToolHandler(payload.childId as string);
      if (!handler) return Response.json({ code: 'TOOL_NOT_FOUND' }, { status: 404 });

      const { tenantId, pluginId } = identity;
      const cancellation = new AbortController();
      const signal = AbortSignal.any([request.signal, cancellation.signal]);
      const invoke = new HttpInvokeClient({
        gatewayUrl: options.invokeGatewayUrl,
        token: request.headers.get('x-fastgpt-invoke-token') ?? '',
        invocationId: request.headers.get('x-fastgpt-invocation-id') ?? '',
        tenantId,
        pluginId,
        signal,
        fetch: options.fetch
      });
      const run = async (streamResponse: (message: PluginStreamAnswerType) => void) => {
        signal.throwIfAborted();
        const input = await handler.inputSchema.parseAsync(payload.input);
        const secrets = await tool.getSecretSchema().parseAsync(payload.secrets ?? {});
        const result = await handler.handler(input, {
          systemVar: payload.systemVar as Parameters<typeof handler.handler>[1]['systemVar'],
          secrets,
          invoke,
          streamResponse
        });
        signal.throwIfAborted();
        return handler.outputSchema.parseAsync(result);
      };

      if (request.headers.get('Accept') !== 'application/x-ndjson') {
        try {
          return Response.json(await run(() => {}));
        } catch {
          return Response.json({ code: 'EXECUTION_FAILED' }, { status: 500 });
        } finally {
          cancellation.abort();
        }
      }

      const encoder = new TextEncoder();
      let closed = false;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          const onAbort = () => {
            if (!closed) {
              closed = true;
              controller.error(request.signal.reason);
            }
          };
          request.signal.addEventListener('abort', onAbort, { once: true });
          if (request.signal.aborted) onAbort();
          const send = (frame: unknown) => {
            if (!closed && !signal.aborted) {
              controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`));
            }
          };
          void (async () => {
            try {
              const result = await run((message) => {
                send({ event: 'chunk', data: { type: 'stream', data: message } });
              });
              send({ event: 'chunk', data: { type: 'response', data: result } });
            } catch {
              // Preserve the ToolFactory business-error message shape without leaking secrets.
              send({ event: 'chunk', data: { type: 'error', data: 'Tool execution failed' } });
            } finally {
              request.signal.removeEventListener('abort', onAbort);
              send({ event: 'end' });
              if (!closed) {
                closed = true;
                controller.close();
              }
              cancellation.abort();
            }
          })();
        },
        cancel(reason) {
          closed = true;
          cancellation.abort(reason);
        }
      });
      return new Response(body, {
        headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' }
      });
    }
  };
}

/** Produces the ES module entry used by the build pipeline in the next task. */
export function generateWorkerEntry(pluginModule: string, options: WorkerRuntimeOptions): string {
  return [
    'import { Buffer as __FastGPT_Buffer__ } from "node:buffer";',
    'if (typeof globalThis.Buffer === "undefined") {',
    '  globalThis.Buffer = __FastGPT_Buffer__;',
    '}',
    `import plugin from ${JSON.stringify(pluginModule)};`,
    'import { createWorkerRuntime } from "@fastgpt-plugin/sdk-factory/runtime-shim";',
    `export default createWorkerRuntime(plugin, ${JSON.stringify({ invokeGatewayUrl: options.invokeGatewayUrl })});`,
    ''
  ].join('\n');
}

function resolveWorkerIdentity(requestUrl: string): { tenantId: string; pluginId: string } {
  const segments = new URL(requestUrl).pathname.split('/').filter(Boolean);
  const runIndex = segments.lastIndexOf('run');
  const tenantId = segments[runIndex - 2];
  const pluginId = segments[runIndex - 1];
  if (runIndex < 2 || !tenantId || !pluginId) {
    throw new Error('Worker request path must include tenant and plugin identity');
  }
  return { tenantId: decodeURIComponent(tenantId), pluginId: decodeURIComponent(pluginId) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
