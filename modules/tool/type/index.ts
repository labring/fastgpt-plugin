import { z } from 'zod';
import {
  ToolConfigSchema,
  ToolSchema,
  ToolSetConfigSchema,
  type ToolConfigWithCbSchema,
  type ToolSetSchema
} from './tool';
import { FlowNodeOutputTypeEnum } from './fastgpt';

export type ToolConfigType = z.infer<typeof ToolConfigSchema>;
export type ToolConfigWithCbType = z.infer<typeof ToolConfigWithCbSchema>;
export function defineTool(tool: ToolConfigType) {
  const versionList = tool.versionList.map((version) => {
    return {
      ...version,
      outputs: version.outputs.map((output) => {
        return {
          ...output,
          type: output.type ?? FlowNodeOutputTypeEnum.static,
          id: output.id ?? output.key
        };
      })
    };
  });
  return {
    ...tool,
    versionList
  };
}

export type ToolSetConfigType = z.infer<typeof ToolSetConfigSchema>;
export function defineToolSet(toolset: ToolSetConfigType) {
  return toolset;
}

export type ToolType = z.infer<typeof ToolSchema>;
export type ToolSetType = z.infer<typeof ToolSetSchema>;

export type ToolMapType = Map<string, ToolType>;
