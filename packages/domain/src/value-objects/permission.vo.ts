import z from 'zod';

export const PluginPermissionEnumSchema = z.enum([
  'userInfo:read',
  'teamInfo:read',
  'model:read',
  'dataset:read',
  'file-upload:allow'
]);

export const PluginPermissionEnum = PluginPermissionEnumSchema.enum;
export type PluginPermissionEnumType = z.infer<typeof PluginPermissionEnumSchema>;
