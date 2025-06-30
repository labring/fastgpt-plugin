import type { z } from 'zod';
import type { ToolSetConfigType } from '@tool/type';
import { ToolConfigSchema, ToolSchema, type SystemVarType } from '@tool/type/tool';
import type { ToolListItemType } from '@tool/type/api';

export const exportTool = <T extends z.Schema>({
  toolCb,
  InputType,
  config
}: {
  toolCb: (props: z.infer<T>, systemVar: SystemVarType) => Promise<Record<string, any>>;
  InputType: T;
  config: z.infer<typeof ToolConfigSchema>;
}) => {
  const cb = async (props: z.infer<T>, systemVar: SystemVarType) => {
    try {
      const output = await toolCb(InputType.parse(props), systemVar);
      return {
        output
      };
    } catch (error: any) {
      // Handle zod validation errors
      if (error.name === 'ZodError') {
        const zodError = error as z.ZodError;
        const errorMessage = zodError.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return { error: errorMessage };
      }
      return { error };
    }
  };

  return {
    ...config,
    cb
  };
};

export const exportToolSet = ({ config }: { config: ToolSetConfigType }) => {
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
    hasTokenFee: false
  }));
}
