import type { Schema } from 'mongoose';
import z from 'zod';

import pluginModel from './plugin.model';
import pluginInstallationModel from './plugin-installation.model';
import pluginPendingInstallationModel from './plugin-pending-installation.model';
import pluginRuntimeConfig from './plugin-runtime-config.model';
import s3TtlModel from './s3-ttl.model';

const ModelEnumSchema = z.enum([
  'plugin',
  's3ttl',
  'pluginRuntimeConfig',
  'pluginInstallation',
  'pluginPendingInstallation'
]);
export const ModelEnum = ModelEnumSchema.enum;
export type ModelEnumType = z.infer<typeof ModelEnumSchema>;

export const ModelSchemaMap = {
  plugin: pluginModel,
  s3ttl: s3TtlModel,
  pluginRuntimeConfig: pluginRuntimeConfig,
  pluginInstallation: pluginInstallationModel,
  // legacy collection remains registered for TTL cleanup of old production data.
  pluginPendingInstallation: pluginPendingInstallationModel
} as const satisfies Record<ModelEnumType, { name: string; schema: Schema }>;

export const models = Object.values(ModelSchemaMap);
