import { ToolConfigType, ToolSetConfigType } from './tools/types';
import { FlowNodeOutputTypeEnum } from './tools/types/fastgpt';

export function defineTool(tool: ToolConfigType) {
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
  return {
    ...tool,
    versionList
  };
}

export function defineToolSet(toolset: ToolSetConfigType) {
  return toolset;
}
