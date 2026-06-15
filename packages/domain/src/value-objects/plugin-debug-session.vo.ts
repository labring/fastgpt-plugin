import z from 'zod';

export const PluginDebugSessionIdSchema = z.string().min(1);
export type PluginDebugSessionId = z.infer<typeof PluginDebugSessionIdSchema>;

export const PluginDebugSessionTmbIdSchema = z.string().min(1);
export type PluginDebugSessionTmbId = z.infer<typeof PluginDebugSessionTmbIdSchema>;

export const PluginDebugSessionSourceSchema = z
  .string()
  .min(1)
  .refine((source) => parsePluginDebugSessionSource(source) !== null, {
    message: 'Invalid plugin debug session source'
  });
export type PluginDebugSessionSource = z.infer<typeof PluginDebugSessionSourceSchema>;

export const PluginDebugSessionStatusSchema = z.enum([
  'pending',
  'connected',
  'disconnected',
  'revoked',
  'expired'
]);
export type PluginDebugSessionStatus = z.infer<typeof PluginDebugSessionStatusSchema>;

export const PluginDebugSessionSchema = z.object({
  debugSessionId: PluginDebugSessionIdSchema,
  tmbId: PluginDebugSessionTmbIdSchema,
  source: z.string().min(1),
  status: PluginDebugSessionStatusSchema,
  ticketHash: z.string().min(1),
  gatewaySessionId: z.string().min(1).optional(),
  createdAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  revokedAt: z.number().int().positive().optional()
});
export type PluginDebugSession = z.infer<typeof PluginDebugSessionSchema>;

export function makePluginDebugSessionSource(input: {
  tmbId: string;
  debugSessionId: string;
}): string {
  return `debug:tmbId:${input.tmbId}:session:${input.debugSessionId}`;
}

export function parsePluginDebugSessionSource(
  source: string
): { tmbId: string; debugSessionId: string } | null {
  const match = /^debug:tmbId:([^:]+):session:([^:]+)$/.exec(source);
  if (!match) {
    return null;
  }

  return {
    tmbId: match[1],
    debugSessionId: match[2]
  };
}

export function isPluginDebugSessionSource(source: string | undefined): source is string {
  return typeof source === 'string' && parsePluginDebugSessionSource(source) !== null;
}
