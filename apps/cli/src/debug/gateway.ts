import { randomUUID } from 'node:crypto';

import {
  type ConnectionGatewayEnvelope,
  type ConnectionGatewaySession,
  type ConnectionGatewayWsServerMessage,
  ConnectionGatewayWsServerMessageSchema
} from '@domain/value-objects/connection-gateway.vo';
import {
  CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
  ConnectionGatewayPluginDebugRequestPayloadSchema
} from '@domain/value-objects/connection-gateway-debug.vo';
import { ToolStreamMessageSchema, type ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import type { LocalDebugRuntime } from './runtime';
import { type DebugPluginSnapshot, runDebugTool } from './session';

export type DebugGatewayClientOptions = {
  gatewayUrl: string;
  connectToken: string;
  userId: string;
  teamId?: string;
  source?: string;
  tokenTtlMs: number;
  reconnect?: boolean;
  reconnectIntervalMs?: number;
  resolveReconnectOptions?: () => Promise<DebugGatewayClientOptions>;
};

export type DebugGatewayTarget = {
  runtime: LocalDebugRuntime;
  snapshot: DebugPluginSnapshot;
};

export type DebugGatewayClient = {
  session: ConnectionGatewaySession;
  updateTargets(targets: DebugGatewayTarget[]): void;
  close(): void;
  closed: Promise<void>;
};

const GATEWAY_DUPLICATE_CONNECTION_CODE = 'connection_gateway.session_already_bound';

export async function connectDebugGateway({
  targets,
  options,
  onLog
}: {
  targets: DebugGatewayTarget[];
  options: DebugGatewayClientOptions;
  onLog?: (message: string) => void;
}): Promise<DebugGatewayClient> {
  if (targets.length === 0) {
    throw new Error('Gateway debug targets cannot be empty');
  }

  if (options.reconnect) {
    return connectReconnectingDebugGateway({ targets, options, onLog });
  }

  return connectSingleDebugGateway({ targets, options, onLog });
}

async function connectReconnectingDebugGateway({
  targets,
  options,
  onLog
}: {
  targets: DebugGatewayTarget[];
  options: DebugGatewayClientOptions;
  onLog?: (message: string) => void;
}): Promise<DebugGatewayClient> {
  let closed = false;
  let current: DebugGatewayClient | null = null;
  let currentSession: ConnectionGatewaySession | null = null;
  let latestTargets = targets;
  let hasAttemptedConnection = false;
  let currentOptions = options;
  const resolveReconnectOptions = options.resolveReconnectOptions;
  const intervalMs = Math.max(100, options.reconnectIntervalMs ?? 2_000);

  const closedPromise = (async () => {
    while (!closed) {
      try {
        const attemptOptions =
          hasAttemptedConnection && resolveReconnectOptions
            ? await resolveReconnectOptions()
            : currentOptions;
        hasAttemptedConnection = true;
        currentOptions = {
          ...attemptOptions,
          resolveReconnectOptions
        };
        current = await connectSingleDebugGateway({
          targets: latestTargets,
          options: currentOptions,
          onLog
        });
        currentSession = current.session;
        await current.closed;
      } catch (error) {
        if (closed) {
          return;
        }

        if (isDuplicateConnectionError(error)) {
          closed = true;
          throw error;
        }

        onLog?.(`Connection Gateway 调试通道断开: ${formatErrorMessage(error)}`);
      } finally {
        current = null;
      }

      if (!closed) {
        onLog?.(`将在 ${intervalMs}ms 后重连 Connection Gateway。`);
        await delay(intervalMs);
      }
    }
  })();

  while (!currentSession && !closed) {
    await delay(10);
  }

  if (!currentSession) {
    throw new Error('Connection Gateway debug session was closed before connecting');
  }

  return {
    session: currentSession,
    updateTargets(targets) {
      latestTargets = targets;
      current?.updateTargets(targets);
    },
    close() {
      closed = true;
      current?.close();
    },
    closed: closedPromise
  };
}

async function connectSingleDebugGateway({
  targets,
  options,
  onLog
}: {
  targets: DebugGatewayTarget[];
  options: DebugGatewayClientOptions;
  onLog?: (message: string) => void;
}): Promise<DebugGatewayClient> {
  const socket = await openWebSocket(options.gatewayUrl);
  let targetsByPluginId = createTargetsByPluginId(targets);
  let closed = false;
  let session: ConnectionGatewaySession | null = null;
  let boundResolve: (session: ConnectionGatewaySession) => void;
  let boundReject: (error: Error) => void;
  const bound = new Promise<ConnectionGatewaySession>((resolve, reject) => {
    boundResolve = resolve;
    boundReject = reject;
  });

  const closedPromise = new Promise<void>((resolve) => {
    socket.addEventListener('close', () => {
      closed = true;
      resolve();
    });
    socket.addEventListener('error', () => {
      onLog?.('Connection Gateway WebSocket 错误');
    });
  });

  socket.addEventListener('message', (event) => {
    const message = parseWsServerMessage(event.data);
    if (message.type === 'bound') {
      session = message.session;
      boundResolve(message.session);
      return;
    }

    if (message.type === 'heartbeat') {
      return;
    }

    if (message.type === 'error') {
      const error = createGatewayError(message.code, message.message);
      if (!session) {
        boundReject(error);
      }
      onLog?.(`Connection Gateway 错误: ${message.code} ${message.message}`);
      return;
    }

    if (message.type === 'envelope') {
      const envelope = message.envelope;
      if (!session) {
        boundReject(new Error('Gateway envelope received before session bound'));
        return;
      }
      void handleGatewayEnvelope({
        socket,
        session,
        targetsByPluginId,
        envelope,
        onLog
      }).catch(async (error) => {
        if (session) {
          await sendEnvelope(socket, makeErrorEnvelope(session, envelope, error));
        }
      });
    }
  });

  await sendMessage(socket, {
    protocol: 'connection-gateway.ws.v1',
    type: 'bind',
    requestId: randomUUID(),
    token: options.connectToken,
    metadata: makePluginDebugMetadata(targets, options.source)
  }).catch(async (error) => {
    socket.close();
    throw error;
  });

  const boundSession = await bound;
  onLog?.(`已连接 Connection Gateway session: ${boundSession.id}`);

  return {
    session: boundSession,
    updateTargets(targets) {
      targetsByPluginId = createTargetsByPluginId(targets);
      onLog?.(
        `已热更新本地调试插件: ${targets.map((target) => target.snapshot.pluginId).join(', ')}`
      );
    },
    close() {
      if (!closed) {
        socket.close();
      }
    },
    closed: closedPromise
  };
}

function createTargetsByPluginId(targets: DebugGatewayTarget[]): Map<string, DebugGatewayTarget> {
  return new Map(targets.map((target) => [target.snapshot.pluginId, target]));
}

async function handleGatewayEnvelope({
  socket,
  session,
  targetsByPluginId,
  envelope,
  onLog
}: {
  socket: WebSocket;
  session: ConnectionGatewaySession;
  targetsByPluginId: Map<string, DebugGatewayTarget>;
  envelope: ConnectionGatewayEnvelope;
  onLog?: (message: string) => void;
}): Promise<void> {
  if (envelope.type !== 'request') {
    return;
  }

  const request = ConnectionGatewayPluginDebugRequestPayloadSchema.parse(envelope.payload);
  const source = request.payload.source ?? session.sessionScope.source;
  if (!source) {
    throw new Error('Gateway debug request missing source');
  }
  const pluginId = request.payload.pluginId;
  if (!pluginId) {
    throw new Error('Gateway debug request missing pluginId');
  }
  const target = targetsByPluginId.get(pluginId);
  if (!target) {
    throw new Error(`Gateway debug target not found: ${source} ${pluginId}`);
  }
  onLog?.(`收到远程调试请求: ${source} ${pluginId} ${envelope.requestId ?? '-'}`);

  await sendEnvelope(socket, {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: requiredRequestId(envelope),
    type: 'response',
    consumerType: session.consumerType,
    capability: CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
    traceId: envelope.traceId,
    createdAt: Date.now(),
    payload: {
      kind: 'plugin-debug.accepted'
    }
  });

  const result = await runDebugTool({
    runtime: target.runtime,
    snapshot: target.snapshot,
    toolId: request.payload.childId,
    input: request.payload.input,
    secrets: request.payload.secrets,
    systemVar: request.payload.systemVar
  });

  for (const message of result.streamMessages) {
    await sendStreamChunk(socket, session, envelope, message);
  }

  await sendEnvelope(socket, {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: requiredRequestId(envelope),
    type: 'stream',
    consumerType: session.consumerType,
    capability: CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
    traceId: envelope.traceId,
    createdAt: Date.now(),
    payload: {
      kind: 'plugin-debug.stream',
      event: 'end'
    }
  });
}

async function sendStreamChunk(
  socket: WebSocket,
  session: ConnectionGatewaySession,
  request: ConnectionGatewayEnvelope,
  message: ToolStreamMessageType
): Promise<void> {
  await sendEnvelope(socket, {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: requiredRequestId(request),
    type: 'stream',
    consumerType: session.consumerType,
    capability: CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
    traceId: request.traceId,
    createdAt: Date.now(),
    payload: {
      kind: 'plugin-debug.stream',
      event: 'chunk',
      data: ToolStreamMessageSchema.parse(message)
    }
  });
}

function makeErrorEnvelope(
  session: ConnectionGatewaySession,
  request: ConnectionGatewayEnvelope,
  error: unknown
): ConnectionGatewayEnvelope {
  return {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: request.requestId,
    type: 'stream',
    consumerType: session.consumerType,
    capability: CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
    traceId: request.traceId,
    createdAt: Date.now(),
    payload: {
      kind: 'plugin-debug.stream',
      event: 'error',
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

function makePluginDebugMetadata(
  targets: DebugGatewayTarget[],
  source?: string
): Record<string, unknown> {
  return {
    pluginDebug: {
      targets: targets.map((target) => ({
        source,
        pluginId: target.snapshot.pluginId,
        version: target.snapshot.version,
        name: target.snapshot.name,
        description: target.snapshot.description,
        toolDescription: target.snapshot.toolDescription,
        author: target.snapshot.author,
        tags: target.snapshot.tags,
        permissions: target.snapshot.permissions,
        secretSchema: target.snapshot.secretSchema,
        isToolSet: target.snapshot.isToolSet,
        tools: target.snapshot.tools
      }))
    }
  };
}

async function openWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener(
      'open',
      () => {
        resolve(socket);
      },
      { once: true }
    );
    socket.addEventListener(
      'error',
      () => {
        reject(new Error(`Connection Gateway WebSocket connect failed: ${url}`));
      },
      { once: true }
    );
  });
}

async function sendEnvelope(socket: WebSocket, envelope: ConnectionGatewayEnvelope): Promise<void> {
  await sendMessage(socket, {
    protocol: 'connection-gateway.ws.v1',
    type: 'envelope',
    envelope
  });
}

async function sendMessage(socket: WebSocket, message: unknown): Promise<void> {
  if (socket.readyState !== WebSocket.OPEN) {
    throw new Error('Connection Gateway WebSocket is not open');
  }

  socket.send(JSON.stringify(message));
}

function requiredRequestId(envelope: ConnectionGatewayEnvelope): string {
  if (!envelope.requestId) {
    throw new Error('Gateway request envelope missing requestId');
  }

  return envelope.requestId;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createGatewayError(code: string, message: string): Error {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function isDuplicateConnectionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ('code' in error ? (error as Error & { code?: string }).code === GATEWAY_DUPLICATE_CONNECTION_CODE : false)
  );
}

function parseWsServerMessage(data: unknown): ConnectionGatewayWsServerMessage {
  const text =
    typeof data === 'string'
      ? data
      : data instanceof ArrayBuffer
        ? Buffer.from(data).toString('utf8')
        : ArrayBuffer.isView(data)
          ? Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8')
          : String(data);

  return ConnectionGatewayWsServerMessageSchema.parse(JSON.parse(text));
}
