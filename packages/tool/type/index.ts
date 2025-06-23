import { z } from 'zod';
import type { ToolConfigSchema, ToolSchema, ToolSetConfigSchema, ToolSetSchema } from './tool';

export const SystemVarSchema = z.object({
  user: z.object({
    id: z.string(),
    teamId: z.string(),
    name: z.string()
  }),
  app: z.object({
    id: z.string(),
    name: z.string()
    // version: z.string()
  }),
  tool: z.object({
    id: z.string(),
    version: z.string().optional()
  }),
  time: z.string()
});
export type SystemVarType = z.infer<typeof SystemVarSchema>;

export function defineTool(tool: z.infer<typeof ToolConfigSchema>) {
  return {
    isToolSet: false,
    ...tool
  };
}

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;
export function defineToolSet(toolset: ToolSetConfigType) {
  return {
    isToolSet: true,
    ...toolset
  };
}

export type ToolType = z.infer<typeof ToolSchema>;
export type ToolSetType = z.infer<typeof ToolSetSchema>;
