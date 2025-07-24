import type { z } from 'zod';
import type { ToolSetConfigType } from '@tool/type';
import { ToolConfigSchema, ToolSchema, type RunToolSecondParamsType } from '@tool/type/tool';
import type { ToolListItemType } from '@tool/type/api';
import {
  FlowNodeInputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum,
  type InputConfigSchema
} from '@tool/type/fastgpt';

export const exportTool = <T extends z.Schema, D extends z.Schema>({
  toolCb,
  InputType,
  OutputType,
  config
}: {
  toolCb: (props: z.infer<T>, e: RunToolSecondParamsType) => Promise<Record<string, any>>;
  InputType: T;
  OutputType: D;
  config: z.infer<typeof ToolConfigSchema>;
}) => {
  const cb = async (props: z.infer<T>, e: RunToolSecondParamsType) => {
    try {
      const output = await toolCb(InputType.parse(props), e);
      return {
        output: OutputType.parse(output)
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
    ...item,
    id: item.toolId,
    avatar: item.icon,
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
