import type {
  ConnectionGatewaySession,
  ConnectionGatewaySessionStatus
} from '@domain/value-objects/connection-gateway.vo';

export type CreateConnectionGatewaySessionInput = Omit<
  ConnectionGatewaySession,
  'generation' | 'status' | 'connectedAt' | 'lastSeenAt'
> & {
  generation?: number;
  status?: ConnectionGatewaySessionStatus;
  now?: number;
};

export type RenewConnectionGatewayOwnerLeaseInput = {
  sessionId: string;
  ownerNodeId: string;
  expiresAt: number;
  now?: number;
};

export interface ConnectionGatewaySessionRegistryPort {
  create(input: CreateConnectionGatewaySessionInput): Promise<ConnectionGatewaySession>;
  get(sessionId: string): Promise<ConnectionGatewaySession | null>;
  listBySubject(subject: string): Promise<ConnectionGatewaySession[]>;
  renewOwnerLease(input: RenewConnectionGatewayOwnerLeaseInput): Promise<boolean>;
  updateStatus(input: {
    sessionId: string;
    ownerNodeId: string;
    status: ConnectionGatewaySessionStatus;
    now?: number;
  }): Promise<boolean>;
  remove(sessionId: string): Promise<void>;
  countActive(): Promise<number>;
}
