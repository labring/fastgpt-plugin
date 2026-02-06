import z, { ZodError, ZodType } from 'zod';
import {
  ToolConfigSchema,
  ToolSetConfigSchema,
  type ToolConfigType,
  type ToolSetConfigType
} from './schemas/tool';
import { FlowNodeOutputTypeEnum } from './schemas/fastgpt';
import type { ToolContextType } from './schemas/req';

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

export const exportTool = <TInput, TOutput>({
  toolCb,
  InputType,
  OutputType,
  config
}: {
  toolCb: (props: TInput, e: ToolContextType) => Promise<Record<string, any>>;
  InputType: ZodType<TInput>;
  OutputType: ZodType<TOutput>;
  config: ToolConfigType;
}) => {
  const cb = async (props: TInput, e: ToolContextType) => {
    try {
      const output = await toolCb(InputType.parse(props), e);
      return {
        output: OutputType.parse(output)
      };
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const issues = error.issues;
        if (issues.length === 0) {
          throw new Error('Unknown Zod error');
        }

        const paths = [];
        for (const issue of issues) {
          if (issue.path) {
            paths.push(...issue.path.flat());
          }
        }
        const fields = Array.from(new Set(paths)).filter(Boolean).join(', ');
        return { error: `Invalid parameters. Please check: ${fields}` };
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
