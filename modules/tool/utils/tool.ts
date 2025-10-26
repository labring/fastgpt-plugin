import type { z } from 'zod';
import type { ToolSetConfigType } from '@tool/type';
import { ToolConfigSchema } from '@tool/type/tool';
import type { RunToolSecondParamsType } from '@tool/type/req';

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
      if (error && error.name === 'ZodError') {
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

// export function formatToolList(
//   list: (z.infer<typeof ToolSchema> | z.infer<typeof ToolSetSchema>)[]
// ): ToolListItemType[] {
//   return list.map((item) => ({
//     author: item.author,
//     name: item.name,
//     parentId: 'parentId' in item ? item.parentId : undefined,
//     courseUrl: item.courseUrl,
//     id: item.toolId,
//     avatar: item.icon,
//     versionList: item.versionList,
//     description: item.description,
//     toolDescription: item.toolDescription,
//     templateType: item.tags?.[0],
//     secretInputConfig: item.secretInputConfig
//   }));
// }
