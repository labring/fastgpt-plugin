import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';
import {
  CONNECTION_GATEWAY_PLUGIN_DEBUG_CONSUMER_TYPE,
  CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
  ConnectionGatewayPluginDebugResponsePayloadSchema,
  ConnectionGatewayPluginDebugStreamPayloadSchema
} from '@domain/value-objects/connection-gateway-debug.vo';
import { createError } from '@domain/value-objects/error.vo';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { StreamData } from '@domain/value-objects/stream.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

export type ConnectionGatewayDebugRuntimeManagerOptions = {
  baseUrl: string;
  authToken: string;
  requestTimeoutMs: number;
  sourceForUser(input: { userId: string }): string;
};

export type ConnectionGatewayDebugRuntimeInvokeOptions = PluginRuntimeInvokeOptions & {
  debug?: {
    userId: string;
    source?: string;
  };
};

export class ConnectionGatewayDebugRuntimeManager
  implements PluginRuntimeManagerPort<PluginRuntimeConfigType, unknown>
{
  constructor(private readonly options: ConnectionGatewayDebugRuntimeManagerOptions) {}

  async register(): Promise<Result> {
    return successResult({});
  }

  async unregister(): Promise<Result> {
    return successResult({});
  }

  async getConfig(): Promise<Result<PluginRuntimeConfigType>> {
    return successResult({});
  }

  async updateConfig(): Promise<Result> {
    return successResult({});
  }

  async resetConfig(): Promise<Result> {
    return successResult({});
  }

  async status(): Promise<Result<unknown>> {
    return successResult({});
  }

  async globalStatus(): Promise<Result<unknown>> {
    return successResult({});
  }

  async shutdown(): Promise<Result> {
    return successResult({});
  }

  async invoke<
    R = unknown,
    S extends boolean = boolean,
    E extends PluginInvokeEventNameType = PluginInvokeEventNameType,
    P = unknown
  >({
    uniqueId,
    eventName,
    payload,
    returnStream,
    options
  }: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: ConnectionGatewayDebugRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    if (eventName !== 'run' || !returnStream) {
      return failureResult(createError(ErrorCode.pluginRuntimeEventNotSupported));
    }

    const debugUserId = options?.debug?.userId;
    if (!debugUserId) {
      return failureResult(
        createError(ErrorCode.pluginRuntimePluginNotFound, {
          message: 'Missing debug user id for connection-gateway runtime'
        })
      );
    }

    try {
      const source =
        options.debug?.source ??
        this.options.sourceForUser({
          userId: debugUserId
        });
      const session = await this.findSessionBySource(source);
      const responses = this.publishRequestAndReadStream({
        session,
        invocationId: options?.invocationId,
        timeoutMs: options?.timeout ?? this.options.requestTimeoutMs,
        source,
        pluginId: uniqueId.pluginId,
        payload
      });

      return successResult(
        StreamData.create<R>((stream) => {
          void consumeGatewayResponses(responses, stream).catch((error) => {
            stream.fail(error instanceof Error ? error : new Error(String(error)));
          });
        }) as S extends true ? StreamData<R> : R
      );
    } catch (error) {
      return failureResult(
        createError(ErrorCode.pluginInvokeFailed, {
          cause: error
        })
      );
    }
  }

  private async findSessionBySource(source: string): Promise<GatewayDebugSession> {
    const status = await this.getJson<GatewayStatusResponse>(
      `/internal/sessions/by-source/${encodeURIComponent(source)}/status`
    );
    const session = status.data.session;

    if (
      !session ||
      session.consumerType !== CONNECTION_GATEWAY_PLUGIN_DEBUG_CONSUMER_TYPE ||
      session.status !== 'connected' ||
      status.data.ownerAlive === false
    ) {
      throw createError(ErrorCode.connectionGatewaySessionNotFound, {
        data: {
          source,
          status: session?.status,
          ownerAlive: status.data.ownerAlive
        }
      });
    }

    return session;
  }

  private async *publishRequestAndReadStream({
    session,
    invocationId,
    timeoutMs,
    source,
    pluginId,
    payload
  }: {
    session: GatewayDebugSession;
    invocationId?: string;
    timeoutMs: number;
    source: string;
    pluginId: string;
    payload: unknown;
  }): AsyncIterable<ConnectionGatewayEnvelope> {
    const response = await fetch(
      `${this.baseUrl}/internal/sessions/${encodeURIComponent(session.id)}/requests:stream`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeoutMs,
          envelope: {
            protocol: 'connection-gateway.v1',
            sessionId: session.id,
            generation: session.generation,
            requestId: invocationId,
            type: 'request',
            consumerType: session.consumerType,
            capability: CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
            createdAt: Date.now(),
            payload: {
              kind: 'plugin-debug.run',
              eventName: 'run',
              payload: {
                ...toObjectPayload(payload),
                pluginId,
                source
              }
            }
          }
        })
      }
    );

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`Gateway stream request failed: ${response.status} ${text}`);
    }

    yield* readNdjsonEnvelopes(response.body);
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.options.authToken}`
      }
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status} ${text}`);
    }

    return JSON.parse(text) as T;
  }

  private get baseUrl(): string {
    return this.options.baseUrl.replace(/\/+$/, '');
  }
}

function toObjectPayload(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

type GatewayDebugSession = {
  id: string;
  consumerType: string;
  generation: number;
  status: string;
};

type GatewayStatusResponse = {
  data: {
    session: GatewayDebugSession | null;
    ownerAlive?: boolean;
  };
};

async function consumeGatewayResponses<R>(
  responses: AsyncIterable<ConnectionGatewayEnvelope>,
  stream: StreamData<R>
): Promise<void> {
  for await (const envelope of responses) {
    if (envelope.type === 'response') {
      const response = ConnectionGatewayPluginDebugResponsePayloadSchema.parse(envelope.payload);
      if (response.kind === 'plugin-debug.error') {
        throw new Error(response.message);
      }
      continue;
    }

    if (envelope.type !== 'stream') {
      continue;
    }

    const frame = ConnectionGatewayPluginDebugStreamPayloadSchema.parse(envelope.payload);
    if (frame.event === 'chunk') {
      stream.write(frame.data as R);
      continue;
    }

    if (frame.event === 'error') {
      throw new Error(frame.message);
    }

    stream.close();
    return;
  }

  stream.close();
}

async function* readNdjsonEnvelopes(body: ReadableStream<Uint8Array>): AsyncIterable<ConnectionGatewayEnvelope> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    while (true) {
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex < 0) {
        break;
      }

      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        yield JSON.parse(line) as ConnectionGatewayEnvelope;
      }
    }

    if (done) {
      const trailing = buffer.trim();
      if (trailing) {
        yield JSON.parse(trailing) as ConnectionGatewayEnvelope;
      }
      return;
    }
  }
}
