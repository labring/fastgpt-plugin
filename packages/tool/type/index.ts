import { z } from 'zod';
import type {
  ToolConfigSchema,
  toolConfigWithCbSchema,
  ToolSchema,
  ToolSetConfigSchema,
  ToolSetSchema
} from './tool';

export type ToolConfigType = z.infer<typeof ToolConfigSchema>;
export type ToolConfigWithCbType = z.infer<typeof toolConfigWithCbSchema>;
export function defineTool(tool: ToolConfigType) {
  return {
    ...tool
  };
}

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;
export function defineToolSet(toolset: ToolSetConfigType) {
  return {
    ...toolset
  };
}

export type ToolType = z.infer<typeof ToolSchema>;
export type ToolSetType = z.infer<typeof ToolSetSchema>;
