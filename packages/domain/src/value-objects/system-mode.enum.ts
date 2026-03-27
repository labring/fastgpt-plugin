import z from 'zod';

export const SystemModeSchema = z.enum(['remote', 'local', 'serverless']);
export type SystemModeType = z.infer<typeof SystemModeSchema>;
export const SystemModeEnum = SystemModeSchema.enum;
