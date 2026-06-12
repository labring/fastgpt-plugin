import { createHmac, randomUUID } from 'node:crypto';
import net from 'node:net';

import {
  type ConnectionGatewayEnvelope,
  type ConnectionGatewaySession,
  ConnectionGatewaySessionSchema
} from '@domain/value-objects/connection-gateway.vo';
import {
  CONNECTION_GATEWAY_BIND_CAPABILITY,
  CONNECTION_GATEWAY_PLUGIN_DEBUG_CONSUMER_TYPE,
  CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY,
  ConnectionGatewayPluginDebugRequestPayloadSchema
} from '@domain/value-objects/connection-gateway-debug.vo';
import { ToolStreamMessageSchema, type ToolStreamMessageType } from '@domain/value-objects/tool.vo';

import type { LocalDebugRuntime } from './runtime';
import { type DebugPluginSnapshot, runDebugTool } from './session';

const TOKEN_HEADER = {
  alg: 'HS256',
  typ: 'CGT'
};

export type DebugGatewayClientOptions = {
  baseUrl: string;
  authToken: string;
  jwtSecret: string;
  tcpHost: string;
  tcpPort: number;
  userId: string;
  teamId?: string;
  source?: string;
  subject?: string;
  tokenTtlMs: number;
  reconnect?: boolean;
  reconnectIntervalMs?: number;
};

export type DebugGatewayTarget = {
  runtime: LocalDebugRuntime;
  snapshot: DebugPluginSnapshot;
};

export type DebugGatewayClient = {
  session: ConnectionGatewaySession;
  close(): void;
  closed: Promise<void>;
};

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
  const intervalMs = Math.max(100, options.reconnectIntervalMs ?? 2_000);

  const closedPromise = (async () => {
    while (!closed) {
      try {
        current = await connectSingleDebugGateway({ targets, options, onLog });
        currentSession = current.session;
        await current.closed;
      } catch (error) {
        if (closed) {
          return;
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
  const session = await createGatewaySession(targets, options);
  const socket = await connectTcp(options.tcpHost, options.tcpPort).catch(async (error) => {
    await deleteGatewaySession(session, options).catch((cleanupError) => {
      onLog?.(`Connection Gateway session 清理失败: ${formatErrorMessage(cleanupError)}`);
    });
    throw error;
  });
  const decoder = new ContentLengthJsonFrameDecoder(1024 * 1024 * 16);
  const targetsByPluginId = new Map(targets.map((target) => [target.snapshot.pluginId, target]));
  let closed = false;

  const closedPromise = new Promise<void>((resolve) => {
    socket.once('close', async () => {
      closed = true;
      await deleteGatewaySession(session, options).catch((error) => {
        onLog?.(`Connection Gateway session 清理失败: ${formatErrorMessage(error)}`);
      });
      resolve();
    });
    socket.once('error', (error) => {
      onLog?.(`Connection Gateway TCP 错误: ${error.message}`);
    });
  });

  socket.on('data', (chunk) => {
    const frames = decoder.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    frames.forEach((envelope) => {
      void handleGatewayEnvelope({
        socket,
        session,
        targetsByPluginId,
        envelope,
        onLog
      }).catch(async (error) => {
        await sendEnvelope(socket, makeErrorEnvelope(session, envelope, error));
      });
    });
  });

  await sendEnvelope(socket, {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: randomUUID(),
    type: 'event',
    consumerType: session.consumerType,
    capability: CONNECTION_GATEWAY_BIND_CAPABILITY,
    createdAt: Date.now(),
    payload: {
      kind: 'plugin-debug.bind',
      sources: targets.map((target) => ({
        source: session.sessionScope.source,
        pluginId: target.snapshot.pluginId,
        version: target.snapshot.version
      }))
    }
  }).catch(async (error) => {
    socket.destroy(error instanceof Error ? error : new Error(String(error)));
    await deleteGatewaySession(session, options).catch((cleanupError) => {
      onLog?.(`Connection Gateway session 清理失败: ${formatErrorMessage(cleanupError)}`);
    });
    throw error;
  });
  onLog?.(`已连接 Connection Gateway session: ${session.id}`);

  return {
    session,
    close() {
      if (!closed) {
        socket.end();
      }
    },
    closed: closedPromise
  };
}

async function deleteGatewaySession(
  session: ConnectionGatewaySession,
  options: DebugGatewayClientOptions
): Promise<void> {
  const response = await fetch(
    `${normalizeBaseUrl(options.baseUrl)}/internal/sessions/${encodeURIComponent(session.id)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${options.authToken}`
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gateway session delete failed: ${response.status} ${text}`);
  }
}

async function handleGatewayEnvelope({
  socket,
  session,
  targetsByPluginId,
  envelope,
  onLog
}: {
  socket: net.Socket;
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
  socket: net.Socket,
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

async function createGatewaySession(
  targets: DebugGatewayTarget[],
  options: DebugGatewayClientOptions
): Promise<ConnectionGatewaySession> {
  const now = Date.now();
  const source = options.source ?? makeDefaultDebugSource(options.userId);
  const claims = {
    consumerType: CONNECTION_GATEWAY_PLUGIN_DEBUG_CONSUMER_TYPE,
    subject: options.subject ?? `user:${options.userId}`,
    sessionScope: {
      userId: options.userId,
      ...(options.teamId ? { teamId: options.teamId } : {}),
      source
    },
    transport: 'tcp' as const,
    capabilities: [CONNECTION_GATEWAY_PLUGIN_DEBUG_INVOKE_CAPABILITY],
    issuedAt: now,
    expiresAt: now + options.tokenTtlMs,
    nonce: randomUUID()
  };
  const token = signConnectionToken(claims, options.jwtSecret);
  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}/internal/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token,
      transport: 'tcp',
      metadata: {
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
      }
    })
  });
  const payload = await parseJsonResponse(response);
  const session = payload.data?.session;

  return ConnectionGatewaySessionSchema.parse(session);
}

function makeDefaultDebugSource(userId: string): string {
  return `debug:user:${userId}`;
}

function signConnectionToken(claims: unknown, secret: string): string {
  const header = encodeBase64Url(JSON.stringify(TOKEN_HEADER));
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signature = encodeBase64Url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());

  return `${header}.${payload}.${signature}`;
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

async function parseJsonResponse(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return payload;
}

async function connectTcp(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      socket.off('error', reject);
      resolve(socket);
    });
    socket.once('error', reject);
  });
}

async function sendEnvelope(socket: net.Socket, envelope: ConnectionGatewayEnvelope): Promise<void> {
  const frame = encodeContentLengthJsonFrame(envelope);
  await new Promise<void>((resolve, reject) => {
    socket.write(frame, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function encodeContentLengthJsonFrame(envelope: ConnectionGatewayEnvelope): Buffer {
  const body = Buffer.from(JSON.stringify(envelope), 'utf8');
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.byteLength}\r\n\r\n`, 'utf8'),
    body
  ]);
}

class ContentLengthJsonFrameDecoder {
  private buffer = Buffer.alloc(0);

  constructor(private readonly maxFrameBytes: number) {}

  push(chunk: Buffer): ConnectionGatewayEnvelope[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const frames: ConnectionGatewayEnvelope[] = [];

    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) {
        return frames;
      }

      const header = this.buffer.subarray(0, headerEnd).toString('utf8');
      const contentLength = Number(
        header
          .split(/\r?\n/)
          .find((line) => line.toLowerCase().startsWith('content-length:'))
          ?.split(':')[1]
          ?.trim()
      );
      if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
        throw new Error('Invalid Content-Length frame');
      }
      if (contentLength > this.maxFrameBytes) {
        throw new Error(`Gateway frame is too large: ${contentLength}`);
      }

      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;
      if (this.buffer.byteLength < bodyEnd) {
        return frames;
      }

      frames.push(JSON.parse(this.buffer.subarray(bodyStart, bodyEnd).toString('utf8')));
      this.buffer = this.buffer.subarray(bodyEnd);
    }
  }
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
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
