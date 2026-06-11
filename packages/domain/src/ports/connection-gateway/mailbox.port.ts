import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

export type ConnectionGatewayMailboxMessage = {
  id: string;
  envelope: ConnectionGatewayEnvelope;
};

export type ConnectionGatewayMailboxReadInput = {
  sessionId: string;
  afterId?: string;
  blockMs?: number;
  count?: number;
};

export interface ConnectionGatewayMailboxPort {
  publish(sessionId: string, envelope: ConnectionGatewayEnvelope): Promise<string>;
  read(input: ConnectionGatewayMailboxReadInput): Promise<ConnectionGatewayMailboxMessage[]>;
  ack(sessionId: string, messageIds: string[]): Promise<void>;
  trim(sessionId: string, maxLen: number): Promise<void>;
  expire(sessionId: string, ttlMs: number): Promise<void>;
  lag(sessionId: string): Promise<number>;
}
