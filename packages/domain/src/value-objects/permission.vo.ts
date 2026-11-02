import z from 'zod';

const rawPluginPermissionEnumSchema = z.enum([
  'userInfo:read',
  'teamInfo:read',
  'model:read',
  'dataset:read',
  'file-upload:allow',
  'unknown'
]);

export const PluginPermissionEnum = rawPluginPermissionEnumSchema.enum;
export const PluginPermissionEnumSchema = rawPluginPermissionEnumSchema.catch(
  PluginPermissionEnum.unknown
);
export type PluginPermissionEnumType = z.infer<typeof PluginPermissionEnumSchema>;
