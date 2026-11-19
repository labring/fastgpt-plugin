import z from 'zod';

export const CoworkerdWorkerLimitsSchema = z.object({
  cpuMs: z.number().int().positive().default(200),
  memoryMiB: z.number().int().positive().default(128)
});
export type CoworkerdWorkerLimitsType = z.infer<typeof CoworkerdWorkerLimitsSchema>;

export const CoworkerdPluginConfigSchema = z.object({
  tenantId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/).refine((id) => !['routes', 'generation'].includes(id)),
  limits: CoworkerdWorkerLimitsSchema
}).strict();
export type CoworkerdPluginConfigType = z.infer<typeof CoworkerdPluginConfigSchema>;

export const CoworkerdConfigSchema = z.object({
  apiServerUrl: z.string().url(),
  ingressUrl: z.string().url(),
  managementToken: z.string().min(1),
  defaultLimits: CoworkerdWorkerLimitsSchema.default({
    cpuMs: 200,
    memoryMiB: 128
  }),
  internalInvokeGatewayUrl: z.string().url().optional(),
  requestTimeoutMs: z.number().int().positive().default(30_000)
});
export type CoworkerdConfigType = z.infer<typeof CoworkerdConfigSchema>;
