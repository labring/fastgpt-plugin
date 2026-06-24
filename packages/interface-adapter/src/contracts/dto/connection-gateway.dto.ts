import { z } from 'zod';

import {
  ConnectionGatewayEnvelopeSchema,
  ConnectionGatewayMetricsSchema,
  ConnectionGatewaySessionSchema,
  ConnectionGatewaySessionStatusViewSchema,
  ConnectionGatewayTokenClaimsSchema,
  ConnectionGatewayWsClientMessageSchema,
  ConnectionGatewayWsServerMessageSchema
} from '@domain/value-objects/connection-gateway.vo';

export const ConnectionGatewayCreateSessionResponseDTOSchema = z.object({
  session: ConnectionGatewaySessionSchema
});
export type ConnectionGatewayCreateSessionResponseDTO = z.infer<
  typeof ConnectionGatewayCreateSessionResponseDTOSchema
>;

export const ConnectionGatewayUpdateSessionMetadataRequestDTOSchema = z.object({
  metadata: z.record(z.string(), z.unknown())
});
export type ConnectionGatewayUpdateSessionMetadataRequestDTO = z.infer<
  typeof ConnectionGatewayUpdateSessionMetadataRequestDTOSchema
>;

export const ConnectionGatewayRequestDTOSchema = z.object({
  envelope: ConnectionGatewayEnvelopeSchema,
  stream: z.boolean().default(false)
});
export type ConnectionGatewayRequestDTO = z.infer<typeof ConnectionGatewayRequestDTOSchema>;

export const ConnectionGatewayStreamRequestDTOSchema = z.object({
  envelope: ConnectionGatewayEnvelopeSchema,
  timeoutMs: z.number().int().positive().optional()
});
export type ConnectionGatewayStreamRequestDTO = z.infer<
  typeof ConnectionGatewayStreamRequestDTOSchema
>;

export const ConnectionGatewayRequestAcceptedDTOSchema = z.object({
  messageId: z.string(),
  accepted: z.literal(true)
});
export type ConnectionGatewayRequestAcceptedDTO = z.infer<
  typeof ConnectionGatewayRequestAcceptedDTOSchema
>;

export const ConnectionGatewayTokenClaimsDTOSchema = ConnectionGatewayTokenClaimsSchema;
export const ConnectionGatewayMetricsDTOSchema = ConnectionGatewayMetricsSchema;
export const ConnectionGatewaySessionStatusViewDTOSchema =
  ConnectionGatewaySessionStatusViewSchema;
export const ConnectionGatewayWsClientMessageDTOSchema = ConnectionGatewayWsClientMessageSchema;
export const ConnectionGatewayWsServerMessageDTOSchema = ConnectionGatewayWsServerMessageSchema;
