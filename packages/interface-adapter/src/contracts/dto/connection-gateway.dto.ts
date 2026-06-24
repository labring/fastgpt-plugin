import { z } from 'zod';

import {
  ConnectionGatewayEnvelopeSchema,
  ConnectionGatewayMetricsSchema,
  ConnectionGatewaySessionSchema,
  ConnectionGatewaySessionStatusViewSchema,
  ConnectionGatewayTokenClaimsSchema
} from '@domain/value-objects/connection-gateway.vo';

export const ConnectionGatewayCreateSessionRequestDTOSchema = z.object({
  token: z.string().min(1),
  transport: z.enum(['tcp', 'websocket']),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type ConnectionGatewayCreateSessionRequestDTO = z.infer<
  typeof ConnectionGatewayCreateSessionRequestDTOSchema
>;

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
