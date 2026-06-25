import z from 'zod';

export const ConnectionGatewayConsumerTypeSchema = z.string().min(1).max(64);
export type ConnectionGatewayConsumerType = z.infer<typeof ConnectionGatewayConsumerTypeSchema>;

export const ConnectionGatewayTransportSchema = z.literal('websocket');
export type ConnectionGatewayTransport = z.infer<typeof ConnectionGatewayTransportSchema>;

export const ConnectionGatewayCapabilitySchema = z.string().min(1).max(64);
export type ConnectionGatewayCapability = z.infer<typeof ConnectionGatewayCapabilitySchema>;

export const ConnectionGatewaySessionScopeSchema = z.object({
  userId: z.string().min(1),
  teamId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  sources: z.array(z.string().min(1)).optional()
});
export type ConnectionGatewaySessionScope = z.infer<typeof ConnectionGatewaySessionScopeSchema>;

export const ConnectionGatewayTokenClaimsSchema = z.object({
  consumerType: ConnectionGatewayConsumerTypeSchema,
  subject: z.string().min(1),
  sessionScope: ConnectionGatewaySessionScopeSchema,
  transport: ConnectionGatewayTransportSchema,
  capabilities: z.array(ConnectionGatewayCapabilitySchema).default([]),
  expiresAt: z.number().int().positive(),
  issuedAt: z.number().int().positive().optional(),
  nonce: z.string().min(1).optional()
});
export type ConnectionGatewayTokenClaims = z.infer<typeof ConnectionGatewayTokenClaimsSchema>;

export const ConnectionGatewayEnvelopeSchema = z.object({
  protocol: z.literal('connection-gateway.v1'),
  sessionId: z.string().min(1),
  generation: z.number().int().nonnegative(),
  requestId: z.string().min(1).optional(),
  type: z.enum(['request', 'response', 'event', 'stream']),
  consumerType: ConnectionGatewayConsumerTypeSchema,
  capability: ConnectionGatewayCapabilitySchema.optional(),
  traceId: z.string().optional(),
  payload: z.unknown().optional(),
  createdAt: z.number().int().positive()
});
export type ConnectionGatewayEnvelope = z.infer<typeof ConnectionGatewayEnvelopeSchema>;

const ConnectionGatewayWsProtocolSchema = z.literal('connection-gateway.ws.v1');

export const ConnectionGatewayWsBindMessageSchema = z.object({
  protocol: ConnectionGatewayWsProtocolSchema,
  type: z.literal('bind'),
  requestId: z.string().min(1),
  token: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type ConnectionGatewayWsBindMessage = z.infer<
  typeof ConnectionGatewayWsBindMessageSchema
>;

export const ConnectionGatewayWsEnvelopeMessageSchema = z.object({
  protocol: ConnectionGatewayWsProtocolSchema,
  type: z.literal('envelope'),
  envelope: ConnectionGatewayEnvelopeSchema
});
export type ConnectionGatewayWsEnvelopeMessage = z.infer<
  typeof ConnectionGatewayWsEnvelopeMessageSchema
>;

export const ConnectionGatewayWsHeartbeatMessageSchema = z.object({
  protocol: ConnectionGatewayWsProtocolSchema,
  type: z.literal('heartbeat'),
  ts: z.number().int().positive()
});
export type ConnectionGatewayWsHeartbeatMessage = z.infer<
  typeof ConnectionGatewayWsHeartbeatMessageSchema
>;

export const ConnectionGatewayWsErrorMessageSchema = z.object({
  protocol: ConnectionGatewayWsProtocolSchema,
  type: z.literal('error'),
  requestId: z.string().min(1).optional(),
  code: z.string().min(1),
  message: z.string().min(1)
});
export type ConnectionGatewayWsErrorMessage = z.infer<
  typeof ConnectionGatewayWsErrorMessageSchema
>;

export const ConnectionGatewayWsBoundMessageSchema = z.object({
  protocol: ConnectionGatewayWsProtocolSchema,
  type: z.literal('bound'),
  requestId: z.string().min(1),
  session: z.lazy(() => ConnectionGatewaySessionSchema)
});
export type ConnectionGatewayWsBoundMessage = z.infer<typeof ConnectionGatewayWsBoundMessageSchema>;

export const ConnectionGatewayWsClientMessageSchema = z.discriminatedUnion('type', [
  ConnectionGatewayWsBindMessageSchema,
  ConnectionGatewayWsEnvelopeMessageSchema,
  ConnectionGatewayWsHeartbeatMessageSchema
]);
export type ConnectionGatewayWsClientMessage = z.infer<
  typeof ConnectionGatewayWsClientMessageSchema
>;

export const ConnectionGatewayWsServerMessageSchema = z.discriminatedUnion('type', [
  ConnectionGatewayWsBoundMessageSchema,
  ConnectionGatewayWsEnvelopeMessageSchema,
  ConnectionGatewayWsHeartbeatMessageSchema,
  ConnectionGatewayWsErrorMessageSchema
]);
export type ConnectionGatewayWsServerMessage = z.infer<
  typeof ConnectionGatewayWsServerMessageSchema
>;

export const ConnectionGatewaySessionStatusSchema = z.enum([
  'connecting',
  'connected',
  'draining',
  'closed'
]);
export type ConnectionGatewaySessionStatus = z.infer<typeof ConnectionGatewaySessionStatusSchema>;

export const ConnectionGatewaySessionSchema = z.object({
  id: z.string().min(1),
  consumerType: ConnectionGatewayConsumerTypeSchema,
  subject: z.string().min(1),
  sessionScope: ConnectionGatewaySessionScopeSchema,
  transport: ConnectionGatewayTransportSchema,
  capabilities: z.array(ConnectionGatewayCapabilitySchema),
  generation: z.number().int().nonnegative(),
  ownerNodeId: z.string().min(1),
  status: ConnectionGatewaySessionStatusSchema,
  connectedAt: z.number().int().positive(),
  lastSeenAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type ConnectionGatewaySession = z.infer<typeof ConnectionGatewaySessionSchema>;

export const ConnectionGatewaySessionStatusViewSchema = z.object({
  session: ConnectionGatewaySessionSchema.nullable(),
  ownerAlive: z.boolean(),
  mailboxLag: z.number().int().nonnegative(),
  logs: z.array(
    z.object({
      ts: z.number().int().positive(),
      level: z.enum(['debug', 'info', 'warn', 'error']),
      message: z.string(),
      data: z.record(z.string(), z.unknown()).optional()
    })
  )
});
export type ConnectionGatewaySessionStatusView = z.infer<
  typeof ConnectionGatewaySessionStatusViewSchema
>;

export const ConnectionGatewayMetricsSchema = z.object({
  nodeId: z.string(),
  activeConnections: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative(),
  inFlightRequests: z.number().int().nonnegative(),
  streamBufferBytes: z.number().int().nonnegative(),
  slowConsumers: z.number().int().nonnegative(),
  ownerLeaseExpiries: z.number().int().nonnegative(),
  mailbox: z.object({
    lag: z.number().int().nonnegative(),
    redisRoundTripMs: z.number().nonnegative()
  }),
  limits: z.object({
    maxConnections: z.number().int().positive(),
    maxSessionsPerSubject: z.number().int().positive(),
    maxInFlightPerSession: z.number().int().positive(),
    maxEnvelopeBytes: z.number().int().positive()
  })
});
export type ConnectionGatewayMetrics = z.infer<typeof ConnectionGatewayMetricsSchema>;

export const ConnectionGatewayResourceLimitsSchema = z.object({
  maxConnections: z.number().int().positive(),
  maxSessionsPerSubject: z.number().int().positive(),
  maxInFlightPerSession: z.number().int().positive(),
  maxEnvelopeBytes: z.number().int().positive(),
  slowConsumerBufferBytes: z.number().int().positive()
});
export type ConnectionGatewayResourceLimits = z.infer<
  typeof ConnectionGatewayResourceLimitsSchema
>;

export const ConnectionGatewayErrorCode = {
  invalidToken: 'CONNECTION_GATEWAY_INVALID_TOKEN',
  tokenExpired: 'CONNECTION_GATEWAY_TOKEN_EXPIRED',
  transportMismatch: 'CONNECTION_GATEWAY_TRANSPORT_MISMATCH',
  capabilityDenied: 'CONNECTION_GATEWAY_CAPABILITY_DENIED',
  staleGeneration: 'CONNECTION_GATEWAY_STALE_GENERATION',
  sessionNotFound: 'CONNECTION_GATEWAY_SESSION_NOT_FOUND',
  sessionAlreadyBound: 'CONNECTION_GATEWAY_SESSION_ALREADY_BOUND',
  sessionOwnerExpired: 'CONNECTION_GATEWAY_SESSION_OWNER_EXPIRED',
  resourceLimitExceeded: 'CONNECTION_GATEWAY_RESOURCE_LIMIT_EXCEEDED',
  envelopeTooLarge: 'CONNECTION_GATEWAY_ENVELOPE_TOO_LARGE'
} as const;

export type ConnectionGatewayErrorCode =
  (typeof ConnectionGatewayErrorCode)[keyof typeof ConnectionGatewayErrorCode];
