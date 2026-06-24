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
  'enabled',
  'connected',
  'disconnected',
  'revoked'
]);
export type PluginDebugSessionStatus = z.infer<typeof PluginDebugSessionStatusSchema>;

export const PluginDebugSessionSchema = z.object({
  tmbId: PluginDebugSessionTmbIdSchema,
  source: z.string().min(1),
  status: PluginDebugSessionStatusSchema,
  enabled: z.boolean(),
  keyId: z.string().min(1),
  connectionKeyHash: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  refreshedAt: z.number().int().positive().optional(),
  revokedAt: z.number().int().positive().optional()
});
export type PluginDebugSession = z.infer<typeof PluginDebugSessionSchema>;

export function makePluginDebugSessionSource(input: { tmbId: string }): string {
  return `debug:tmbId:${input.tmbId}`;
}

export function parsePluginDebugSessionSource(source: string): { tmbId: string } | null {
  const match = /^debug:tmbId:([^:]+)$/.exec(source);
  if (!match) {
    return null;
  }

  return {
    tmbId: match[1]
  };
}

export function isPluginDebugSessionSource(source: string | undefined): source is string {
  return typeof source === 'string' && parsePluginDebugSessionSource(source) !== null;
}
