import { createHash, randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';

import {
  type ConnectionGatewayWsClientMessage,
  ConnectionGatewayWsClientMessageSchema,
  type ConnectionGatewayWsServerMessage} from '@domain/value-objects/connection-gateway.vo';

import { ConnectionGatewayResourceLimiter } from '../resource-limiter';

import type { ConnectionGatewayTransportConnection } from './transport';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export type WebSocketConnectionGatewayTransportOptions = {
  path: string;
  maxFrameBytes: number;
  limiter: ConnectionGatewayResourceLimiter;
  handlers: {
    onConnection?(connection: ConnectionGatewayTransportConnection): void;
    onMessage(
      connection: ConnectionGatewayTransportConnection,
      message: ConnectionGatewayWsClientMessage
    ): Promise<void> | void;
    onClose?(connection: ConnectionGatewayTransportConnection, reason?: Error): void;
    onError?(connection: ConnectionGatewayTransportConnection | null, error: Error): void;
  };
};

export class WebSocketConnectionGatewayTransport {
  readonly transport = 'websocket';
  private readonly connections = new Set<WebSocketGatewayConnection>();

  constructor(readonly options: WebSocketConnectionGatewayTransportOptions) {}

  handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): void {
    let connection: WebSocketGatewayConnection | null = null;

    try {
      if (!this.matchesPath(request.url)) {
        socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      const key = request.headers['sec-websocket-key'];
      if (
        request.headers.upgrade?.toLowerCase() !== 'websocket' ||
        request.headers['sec-websocket-version'] !== '13' ||
        typeof key !== 'string' ||
        key.length === 0
      ) {
        socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      this.options.limiter.acquireConnection();
      socket.write(makeUpgradeResponse(key));
      connection = new WebSocketGatewayConnection({
        socket,
        maxFrameBytes: this.options.maxFrameBytes,
        onMessage: (message) => this.options.handlers.onMessage(connection!, message),
        onError: (error) => this.options.handlers.onError?.(connection, error),
        onClose: (reason) => {
          this.connections.delete(connection!);
          this.options.limiter.releaseConnection();
          this.options.handlers.onClose?.(connection!, reason);
        }
      });
      this.connections.add(connection);
      this.options.handlers.onConnection?.(connection);

      if (head.byteLength > 0) {
        connection.receive(head);
      }
    } catch (error) {
      const normalized = normalizeError(error);
      this.options.handlers.onError?.(connection, normalized);
      socket.destroy(normalized);
    }
  }

  async stop(): Promise<void> {
    for (const connection of this.connections) {
      connection.close();
    }
    this.connections.clear();
  }

  private matchesPath(url: string | undefined): boolean {
    if (!url) {
      return false;
    }

    const parsed = new URL(url, 'http://localhost');
    return parsed.pathname === this.options.path;
  }
}

class WebSocketGatewayConnection implements ConnectionGatewayTransportConnection {
  readonly id = randomUUID();
  readonly transport = 'websocket';
  readonly remoteAddress?: string;
  private buffer = Buffer.alloc(0);
  private closed = false;

  constructor(
    private readonly options: {
      socket: Socket;
      maxFrameBytes: number;
      onMessage(message: ConnectionGatewayWsClientMessage): Promise<void> | void;
      onError(error: Error): void;
      onClose(reason?: Error): void;
    }
  ) {
    this.remoteAddress = options.socket.remoteAddress;
    options.socket.on('data', (chunk) => this.receive(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    options.socket.once('close', () => this.handleClose());
    options.socket.once('error', (error) => {
      options.onError(error);
    });
  }

  async send(message: ConnectionGatewayWsServerMessage): Promise<void> {
    if (this.closed) {
      return;
    }

    const frame = encodeWebSocketTextFrame(JSON.stringify(message));
    await new Promise<void>((resolve, reject) => {
      this.options.socket.write(frame, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  close(reason?: Error): void {
    if (this.closed) {
      return;
    }

    if (reason) {
      this.options.onError(reason);
    }
    this.options.socket.end(encodeCloseFrame());
  }

  receive(chunk: Buffer): void {
    if (this.closed) {
      return;
    }

    this.buffer = Buffer.concat([this.buffer, chunk]);

    try {
      while (true) {
        const frame = decodeClientFrame(this.buffer, this.options.maxFrameBytes);
        if (!frame) {
          return;
        }

        this.buffer = this.buffer.subarray(frame.bytesRead);

        if (frame.opcode === 0x8) {
          this.options.socket.end(encodeCloseFrame());
          return;
        }

        if (frame.opcode === 0x9) {
          this.options.socket.write(encodeControlFrame(0xA, frame.payload));
          continue;
        }

        if (frame.opcode === 0xA) {
          continue;
        }

        if (frame.opcode !== 0x1) {
          throw new Error(`Unsupported WebSocket opcode: ${frame.opcode}`);
        }

        const payload = JSON.parse(frame.payload.toString('utf8')) as unknown;
        const message = ConnectionGatewayWsClientMessageSchema.parse(payload);
        void Promise.resolve(this.options.onMessage(message)).catch((error) => {
          this.options.onError(normalizeError(error));
        });
      }
    } catch (error) {
      const normalized = normalizeError(error);
      this.options.onError(normalized);
      this.options.socket.destroy(normalized);
    }
  }

  private handleClose(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.options.onClose();
  }
}

function makeUpgradeResponse(key: string): string {
  const accept = createHash('sha1').update(`${key}${WS_GUID}`).digest('base64');

  return [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '\r\n'
  ].join('\r\n');
}

function decodeClientFrame(
  buffer: Buffer,
  maxFrameBytes: number
): { opcode: number; payload: Buffer; bytesRead: number } | null {
  if (buffer.byteLength < 2) {
    return null;
  }

  const first = buffer[0]!;
  const second = buffer[1]!;
  const fin = (first & 0x80) !== 0;
  const opcode = first & 0x0f;
  const masked = (second & 0x80) !== 0;
  let payloadLength = second & 0x7f;
  let offset = 2;

  if (!fin) {
    throw new Error('Fragmented WebSocket frames are not supported');
  }

  if (!masked) {
    throw new Error('Client WebSocket frames must be masked');
  }

  if (payloadLength === 126) {
    if (buffer.byteLength < offset + 2) {
      return null;
    }
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    if (buffer.byteLength < offset + 8) {
      return null;
    }
    const length = buffer.readBigUInt64BE(offset);
    if (length > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('WebSocket frame is too large');
    }
    payloadLength = Number(length);
    offset += 8;
  }

  if (payloadLength > maxFrameBytes) {
    throw new Error(`WebSocket frame is too large: ${payloadLength}`);
  }

  if (buffer.byteLength < offset + 4 + payloadLength) {
    return null;
  }

  const mask = buffer.subarray(offset, offset + 4);
  offset += 4;
  const payload = Buffer.alloc(payloadLength);
  for (let index = 0; index < payloadLength; index += 1) {
    payload[index] = buffer[offset + index]! ^ mask[index % 4]!;
  }

  return {
    opcode,
    payload,
    bytesRead: offset + payloadLength
  };
}

function encodeWebSocketTextFrame(value: string): Buffer {
  return encodeFrame(0x1, Buffer.from(value, 'utf8'));
}

function encodeCloseFrame(): Buffer {
  return encodeControlFrame(0x8, Buffer.alloc(0));
}

function encodeControlFrame(opcode: number, payload: Buffer): Buffer {
  return encodeFrame(opcode, payload);
}

function encodeFrame(opcode: number, payload: Buffer): Buffer {
  const length = payload.byteLength;
  const headerLength = length < 126 ? 2 : length <= 0xffff ? 4 : 10;
  const frame = Buffer.alloc(headerLength + length);

  frame[0] = 0x80 | opcode;
  if (length < 126) {
    frame[1] = length;
  } else if (length <= 0xffff) {
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
  } else {
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(length), 2);
  }
  payload.copy(frame, headerLength);

  return frame;
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
