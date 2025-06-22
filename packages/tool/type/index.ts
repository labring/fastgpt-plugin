import { z } from 'zod';
import type { InputType, OutputType } from './fastgpt';
import type { ToolConfigSchema, ToolSchema, ToolSetConfigSchema, ToolSetSchema } from './tool';

const InputBaseSchema = z.object({
  version: z.string().optional()
});

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
  time: z.string()
});
export type SystemVarType = z.infer<typeof SystemVarSchema>;

export function defineInputSchema<T extends z.AnyZodObject>(schema: T) {
  return InputBaseSchema.merge(schema);
}

export type ToolConfigType = z.infer<typeof ToolConfigSchema> & {
  inputs: InputType[];
  outputs: OutputType[];
};

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;

export function defineTool(tool: ToolConfigType) {
  return {
    isToolSet: false,
    ...tool
  };
}

export function defineToolSet(toolset: ToolSetConfigType) {
  return {
    isToolSet: true,
    ...toolset
  };
}

export * from './fastgpt';

export type ToolType = z.infer<typeof ToolSchema>;
export type ToolSetType = z.infer<typeof ToolSetSchema>;
