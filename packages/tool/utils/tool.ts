import type { z } from 'zod';
import type { SystemVarType, ToolSetConfigType, ToolType } from '@tool/type';
import { ToolConfigSchema, ToolSchema, type ToolListItemType } from '@tool/type/tool';

export const exportTool = ({
  toolCb,
  InputType,
  config
}: {
  toolCb: (
    props: z.infer<typeof InputType>,
    systemVar: SystemVarType
  ) => Promise<Record<string, any>>;
  InputType: z.ZodTypeAny;
  config: z.infer<typeof ToolConfigSchema>;
}) => {
  const cb = async (props: z.infer<typeof InputType>, systemVar: SystemVarType) => {
    try {
      const output = await toolCb(InputType.parse(props), systemVar);
      return {
        output
      };
    } catch (error) {
      return { error };
    }
  };

  const tool: ToolType = {
    ...config,
    toolId: config.toolId as string,
    icon: config.icon as string,
    toolFile: __dirname,
    cb
  };
  return tool;
};

export const exportToolSet = ({ config }: { config: ToolSetConfigType }) => {
  config.children.forEach((child) => {
    child.toolId = config.toolId + '/' + child.toolId;
    child.parentId = config.toolId;
  });

  return {
    ...config
  };
};

export function formatToolList(list: z.infer<typeof ToolSchema>[]): ToolListItemType[] {
  return list.map((item, index) => ({
    id: item.toolId,
    parentId: item.parentId,
    author: item.author,
    courseUrl: item.courseUrl,
    name: item.name,
    avatar: item.icon,
    versionList: item.versionList,
    intro: item.description,
    templateType: item.type,
    pluginOrder: index,
    isActive: item.isActive ?? true,
    weight: index,
    originCost: 0,
    currentCost: 0,
    hasTokenFee: false,
    inputs: item.inputs,
    outputs: item.outputs
  }));
}
