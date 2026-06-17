import z from 'zod';

import { ConnectionGatewaySessionSchema } from '@domain/value-objects/connection-gateway.vo';

import { PluginListItemDTOSchema } from './plugin.dto';

export const PluginDebugSessionStatusDTOSchema = z.enum([
  'pending',
  'connected',
  'disconnected',
  'revoked',
  'expired'
]);

export const PluginDebugSessionCreateRequestDTOSchema = z.object({
  tmbId: z.string().min(1),
  ttlMs: z.number().int().positive().optional()
});

export const PluginDebugSessionCreateResponseDTOSchema = z.object({
  debugSessionId: z.string().min(1),
  tmbId: z.string().min(1),
  source: z.string().min(1),
  connectKey: z.string().min(1),
  connectKeyExpiresAt: z.number().int().positive(),
  ticket: z.string().min(1).optional(),
  ticketExpiresAt: z.number().int().positive().optional(),
  expiresAt: z.number().int().positive()
});

export const PluginDebugSessionTicketExchangeRequestDTOSchema = z.object({
  connectKey: z.string().min(1).optional(),
  ticket: z.string().min(1).optional()
}).refine((value) => value.connectKey || value.ticket, {
  message: 'connectKey is required'
});

export const PluginDebugSessionTicketExchangeResponseDTOSchema = z.object({
  tcpUrl: z.string().min(1),
  source: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  session: ConnectionGatewaySessionSchema,
  connectToken: z.string().min(1),
  expiresAt: z.number().int().positive()
});

export const PluginDebugSessionGetParamsDTOSchema = z.object({
  debugSessionId: z.string().min(1),
  tmbId: z.string().min(1)
});

export const PluginDebugSessionStatusResponseDTOSchema = z.object({
  debugSessionId: z.string().min(1),
  tmbId: z.string().min(1),
  source: z.string().min(1),
  status: PluginDebugSessionStatusDTOSchema,
  plugins: z.array(PluginListItemDTOSchema),
  gateway: z
    .object({
      sessionId: z.string().min(1).optional(),
      ownerAlive: z.boolean(),
      mailboxLag: z.number().int().nonnegative()
    })
    .optional(),
  expiresAt: z.number().int().positive()
});

export const PluginDebugSessionRevokeParamsDTOSchema = z.object({
  debugSessionId: z.string().min(1)
});

export const PluginDebugSessionRevokeRequestDTOSchema = z.object({
  tmbId: z.string().min(1),
  reason: z.string().optional()
});

export const PluginDebugSessionRevokeResponseDTOSchema = z.object({
  revoked: z.boolean()
});

export type PluginDebugSessionCreateRequestDTO = z.infer<
  typeof PluginDebugSessionCreateRequestDTOSchema
>;
export type PluginDebugSessionCreateResponseDTO = z.infer<
  typeof PluginDebugSessionCreateResponseDTOSchema
>;
export type PluginDebugSessionTicketExchangeRequestDTO = z.infer<
  typeof PluginDebugSessionTicketExchangeRequestDTOSchema
>;
export type PluginDebugSessionTicketExchangeResponseDTO = z.infer<
  typeof PluginDebugSessionTicketExchangeResponseDTOSchema
>;
export type PluginDebugSessionStatusResponseDTO = z.infer<
  typeof PluginDebugSessionStatusResponseDTOSchema
>;
