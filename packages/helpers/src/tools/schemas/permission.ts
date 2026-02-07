import { z } from 'zod';

export const ToolPermissionEnumSchema = z.enum([
  'userInfo:read',
  'teamInfo:read',
  'model:read',
  'dataset:read'
]);

export const ToolPermissionEnum = ToolPermissionEnumSchema.enum;
export type ToolPermissionEnumType = z.infer<typeof ToolPermissionEnumSchema>;
