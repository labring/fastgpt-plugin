import type { ConnectionGatewayTransportServer } from './transport';

export type WebSocketConnectionGatewayTransportOptions = {
  port: number;
};

export class WebSocketConnectionGatewayTransport implements ConnectionGatewayTransportServer {
  readonly transport = 'websocket';

  constructor(readonly options: WebSocketConnectionGatewayTransportOptions) {}

  async start(): Promise<void> {
    throw new Error('WebSocket Connection Gateway transport is not implemented yet');
  }

  async stop(): Promise<void> {}
}
