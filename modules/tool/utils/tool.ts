import type { z } from 'zod';
import type { ToolSetConfigType, ToolType, ToolSetType } from '@tool/type';
import { ToolConfigSchema } from '@tool/type/tool';
import type { RunToolSecondParamsType } from '@tool/type/req';
import { createHash } from 'node:crypto';

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

export function generateToolVersion(versionList: Array<{ value: string }>): string {
  const versionString = versionList.map((v) => v.value).join('');
  return createHash('sha256').update(versionString).digest('hex').substring(0, 8);
}

/**
 * Generate version hash for a tool set based on all child tools' versions
 * @param children - Array of child tools
 * @returns First 8 characters of SHA256 hash of all child version hashes concatenated
 */
export function generateToolSetVersion(children: ToolType[]) {
  if (!children || children.length === 0) {
    return undefined;
  }

  const childVersions = children
    .map((child) => generateToolVersion(child.versionList) || '')
    .sort();
  const versionString = childVersions.join('');

  return createHash('sha256').update(versionString).digest('hex').substring(0, 8);
}
