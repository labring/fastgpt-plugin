import type {
  ConnectionGatewayEnvelope,
  ConnectionGatewayTransport
} from '@domain/value-objects/connection-gateway.vo';

export type ConnectionGatewayTransportConnection = {
  id: string;
  transport: ConnectionGatewayTransport;
  remoteAddress?: string;
  send(envelope: ConnectionGatewayEnvelope): Promise<void>;
  close(reason?: Error): void;
};

export type ConnectionGatewayTransportHandlers = {
  onConnection?(connection: ConnectionGatewayTransportConnection): void;
  onEnvelope(
    connection: ConnectionGatewayTransportConnection,
    envelope: ConnectionGatewayEnvelope
  ): Promise<void> | void;
  onClose?(connection: ConnectionGatewayTransportConnection, reason?: Error): void;
  onError?(connection: ConnectionGatewayTransportConnection | null, error: Error): void;
};

export interface ConnectionGatewayTransportServer {
  readonly transport: ConnectionGatewayTransport;
  start(): Promise<void>;
  stop(): Promise<void>;
}
