import { randomUUID } from 'node:crypto';
import net from 'node:net';

import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

import { ConnectionGatewayResourceLimiter } from '../resource-limiter';

import {
  ContentLengthJsonFrameDecoder,
  encodeContentLengthJsonFrame
} from './tcp-content-length-codec';
import type {
  ConnectionGatewayTransportConnection,
  ConnectionGatewayTransportHandlers,
  ConnectionGatewayTransportServer
} from './transport';

export type TcpConnectionGatewayTransportOptions = {
  port: number;
  host?: string;
  maxFrameBytes: number;
  limiter: ConnectionGatewayResourceLimiter;
  handlers: ConnectionGatewayTransportHandlers;
};

class TcpGatewayConnection implements ConnectionGatewayTransportConnection {
  readonly id = randomUUID();
  readonly transport = 'tcp';
  readonly remoteAddress?: string;

  constructor(private readonly socket: net.Socket) {
    this.remoteAddress = socket.remoteAddress;
  }

  async send(envelope: ConnectionGatewayEnvelope): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket.write(encodeContentLengthJsonFrame(envelope), (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  close(): void {
    this.socket.end();
  }
}

export class TcpConnectionGatewayTransport implements ConnectionGatewayTransportServer {
  readonly transport = 'tcp';
  private server: net.Server | null = null;

  constructor(private readonly options: TcpConnectionGatewayTransportOptions) {}

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.server = net.createServer((socket) => this.handleSocket(socket));

    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(this.options.port, this.options.host, () => {
        this.server?.off('error', reject);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    const server = this.server;
    this.server = null;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private handleSocket(socket: net.Socket): void {
    let connection: TcpGatewayConnection | null = null;

    try {
      this.options.limiter.acquireConnection();
      connection = new TcpGatewayConnection(socket);
      this.options.handlers.onConnection?.(connection);
    } catch (error) {
      socket.destroy(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    const decoder = new ContentLengthJsonFrameDecoder(this.options.maxFrameBytes);

    socket.on('data', (chunk) => {
      try {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        for (const envelope of decoder.push(buffer)) {
          void Promise.resolve(this.options.handlers.onEnvelope(connection, envelope)).catch(
            (error) => {
              this.options.handlers.onError?.(connection, normalizeError(error));
            }
          );
        }
      } catch (error) {
        const normalized = normalizeError(error);
        this.options.handlers.onError?.(connection, normalized);
        socket.destroy(normalized);
      }
    });

    socket.once('close', () => {
      this.options.limiter.releaseConnection();
      this.options.handlers.onClose?.(connection);
    });

    socket.once('error', (error) => {
      this.options.handlers.onError?.(connection, error);
    });
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
