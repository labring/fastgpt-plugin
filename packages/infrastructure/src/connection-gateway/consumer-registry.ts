import type {
  ConnectionGatewayConsumerHandler,
  ConnectionGatewayConsumerRegistryPort
} from '@domain/ports/connection-gateway/consumer-registry.port';
import type { ConnectionGatewayConsumerType } from '@domain/value-objects/connection-gateway.vo';

export class InMemoryConnectionGatewayConsumerRegistry
  implements ConnectionGatewayConsumerRegistryPort
{
  private readonly handlers = new Map<ConnectionGatewayConsumerType, ConnectionGatewayConsumerHandler>();

  register(
    consumerType: ConnectionGatewayConsumerType,
    handler: ConnectionGatewayConsumerHandler
  ): void {
    this.handlers.set(consumerType, handler);
  }

  get(consumerType: ConnectionGatewayConsumerType): ConnectionGatewayConsumerHandler | null {
    return this.handlers.get(consumerType) ?? null;
  }

  has(consumerType: ConnectionGatewayConsumerType): boolean {
    return this.handlers.has(consumerType);
  }
}
