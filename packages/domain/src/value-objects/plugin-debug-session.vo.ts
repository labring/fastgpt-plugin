import z from 'zod';

const PLUGIN_DEBUG_SOURCE_KIND = 'debug';
const PLUGIN_DEBUG_SESSION_SOURCE_TMB_ID_KEY = 'tmbId';

export const PLUGIN_DEBUG_SOURCE_PREFIX = `${PLUGIN_DEBUG_SOURCE_KIND}:`;
export const PLUGIN_DEBUG_SESSION_SOURCE_FORMAT =
  `${PLUGIN_DEBUG_SOURCE_KIND}:${PLUGIN_DEBUG_SESSION_SOURCE_TMB_ID_KEY}:{tmbId}` as const;

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
  source: PluginDebugSessionSourceSchema,
  status: PluginDebugSessionStatusSchema,
  enabled: z.boolean(),
  keyId: z.string().min(1),
  connectionKeyHash: z.string().min(1),
  connectionKey: z.string().min(1).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  refreshedAt: z.number().int().positive().optional(),
  revokedAt: z.number().int().positive().optional()
});
export type PluginDebugSession = z.infer<typeof PluginDebugSessionSchema>;

export function makePluginDebugSessionSource(input: { tmbId: string }): string {
  return [
    PLUGIN_DEBUG_SOURCE_KIND,
    PLUGIN_DEBUG_SESSION_SOURCE_TMB_ID_KEY,
    input.tmbId
  ].join(':');
}

export function parsePluginDebugSessionSource(source: string): { tmbId: string } | null {
  const parts = source.split(':');
  if (
    parts.length !== 3 ||
    parts[0] !== PLUGIN_DEBUG_SOURCE_KIND ||
    parts[1] !== PLUGIN_DEBUG_SESSION_SOURCE_TMB_ID_KEY ||
    !parts[2]
  ) {
    return null;
  }

  return {
    tmbId: parts[2]
  };
}

export function isPluginDebugSource(source: string | undefined): source is string {
  return typeof source === 'string' && source.startsWith(PLUGIN_DEBUG_SOURCE_PREFIX);
}

export function isPluginDebugSessionSource(source: string | undefined): source is string {
  if (typeof source !== 'string') {
    return false;
  }

  const match = parsePluginDebugSessionSource(source);
  if (!match) {
    return false;
  }

  return true;
}
