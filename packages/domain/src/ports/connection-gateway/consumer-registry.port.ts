import type {
  ConnectionGatewayConsumerType,
  ConnectionGatewayEnvelope
} from '@domain/value-objects/connection-gateway.vo';

export type ConnectionGatewayConsumerHandlerResult = {
  envelope?: ConnectionGatewayEnvelope;
  stream?: AsyncIterable<ConnectionGatewayEnvelope>;
};

export type ConnectionGatewayConsumerHandler = (
  envelope: ConnectionGatewayEnvelope
) => Promise<ConnectionGatewayConsumerHandlerResult>;

export interface ConnectionGatewayConsumerRegistryPort {
  register(consumerType: ConnectionGatewayConsumerType, handler: ConnectionGatewayConsumerHandler): void;
  get(consumerType: ConnectionGatewayConsumerType): ConnectionGatewayConsumerHandler | null;
  has(consumerType: ConnectionGatewayConsumerType): boolean;
}
