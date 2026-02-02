import z from 'zod';
import {
  ToolConfigSchema,
  ToolConfigWithCbSchema,
  ToolSchema,
  ToolSetConfigSchema,
  ToolSetSchema
} from '../schemas/tool';

export type ToolConfigType = z.infer<typeof ToolConfigSchema>;
export type ToolConfigWithCbType = z.infer<typeof ToolConfigWithCbSchema>;
export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;
export type ToolType = z.infer<typeof ToolSchema>;
export type ToolSetType = z.infer<typeof ToolSetSchema>;
export type ToolMapType = Map<string, ToolType>;
