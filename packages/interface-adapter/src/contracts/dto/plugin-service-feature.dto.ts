import z from 'zod';

export const PluginServiceFeaturesDTOSchema = z.object({
  remoteDebug: z.boolean()
});

export type PluginServiceFeaturesDTO = z.infer<typeof PluginServiceFeaturesDTOSchema>;
