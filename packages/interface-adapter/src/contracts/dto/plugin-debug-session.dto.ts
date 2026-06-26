import z from 'zod';

import { PluginListItemDTOSchema } from './plugin.dto';

export const PluginDebugSessionStatusDTOSchema = z.enum([
  'enabled',
  'connected',
  'disconnected',
  'revoked'
]);
export type PluginDebugSessionStatusDTO = z.infer<typeof PluginDebugSessionStatusDTOSchema>;

export const PluginDebugSessionCreateRequestDTOSchema = z.object({
  tmbId: z.string().min(1)
});

export const PluginDebugSessionCreateResponseDTOSchema = z.object({
  tmbId: z.string().min(1),
  source: z.string().min(1),
  status: PluginDebugSessionStatusDTOSchema,
  enabled: z.boolean(),
  keyId: z.string().min(1),
  connectionKey: z.string().min(1).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive()
});

export const PluginDebugSessionConnectionKeyExchangeRequestDTOSchema = z.object({
  connectionKey: z.string().min(1)
});

export const PluginDebugSessionConnectionKeyExchangeResponseDTOSchema = z.object({
  gatewayUrl: z.string().min(1),
  transport: z.literal('websocket'),
  source: z.string().min(1),
  connectToken: z.string().min(1),
  fastgptBaseUrl: z.string().min(1),
  expiresAt: z.number().int().positive()
});

export const PluginDebugSessionGetParamsDTOSchema = z.object({
  tmbId: z.string().min(1)
});

export const PluginDebugSessionStatusResponseDTOSchema = z.object({
  tmbId: z.string().min(1),
  source: z.string().min(1),
  status: PluginDebugSessionStatusDTOSchema,
  enabled: z.boolean(),
  keyId: z.string().min(1).optional(),
  plugins: z.array(PluginListItemDTOSchema),
  gateway: z
    .object({
      sessionId: z.string().min(1).optional(),
      ownerAlive: z.boolean(),
      mailboxLag: z.number().int().nonnegative()
    })
    .optional(),
  createdAt: z.number().int().positive().optional(),
  updatedAt: z.number().int().positive().optional(),
  refreshedAt: z.number().int().positive().optional(),
  revokedAt: z.number().int().positive().optional()
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
export type PluginDebugSessionConnectionKeyExchangeRequestDTO = z.infer<
  typeof PluginDebugSessionConnectionKeyExchangeRequestDTOSchema
>;
export type PluginDebugSessionConnectionKeyExchangeResponseDTO = z.infer<
  typeof PluginDebugSessionConnectionKeyExchangeResponseDTOSchema
>;
export type PluginDebugSessionGetParamsDTO = z.infer<typeof PluginDebugSessionGetParamsDTOSchema>;
export type PluginDebugSessionStatusResponseDTO = z.infer<
  typeof PluginDebugSessionStatusResponseDTOSchema
>;
export type PluginDebugSessionRevokeRequestDTO = z.infer<
  typeof PluginDebugSessionRevokeRequestDTOSchema
>;
export type PluginDebugSessionRevokeResponseDTO = z.infer<
  typeof PluginDebugSessionRevokeResponseDTOSchema
>;
