import type {
  ConnectionGatewayCapability,
  ConnectionGatewayTokenClaims,
  ConnectionGatewayTransport
} from '@domain/value-objects/connection-gateway.vo';

export type VerifyConnectionTokenInput = {
  token: string;
  expectedTransport?: ConnectionGatewayTransport;
  requiredCapability?: ConnectionGatewayCapability;
  now?: number;
};

export interface ConnectionGatewayTokenVerifierPort {
  verify(input: VerifyConnectionTokenInput): Promise<ConnectionGatewayTokenClaims>;
}

export interface ConnectionGatewayTokenSignerPort {
  sign(claims: ConnectionGatewayTokenClaims): Promise<string>;
}
