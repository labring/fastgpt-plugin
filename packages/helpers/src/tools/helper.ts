import z from 'zod';
import { ToolConfigSchema, ToolSetConfigSchema } from './schemas/tool';
import { FlowNodeOutputTypeEnum } from './schemas/fastgpt';

export function defineTool(
  tool: z.input<typeof ToolConfigSchema>
): z.output<typeof ToolConfigSchema> {
  const versionList = tool.versionList.map((version) => {
    return {
      ...version,
      outputs: version.outputs.map((output) => {
        return {
          ...output,
          type: output.type ?? FlowNodeOutputTypeEnum.enum.static,
          id: output.id ?? output.key
        };
      })
    };
  });

  return ToolConfigSchema.parse({
    ...tool,
    versionList
  });
}

export function defineToolSet(
  toolset: z.input<typeof ToolSetConfigSchema>
): z.output<typeof ToolSetConfigSchema> {
  return ToolSetConfigSchema.parse(toolset);
}
