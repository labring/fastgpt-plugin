import { ZodError } from 'zod';
import type { ToolSetConfigType, ToolType, ToolConfigType } from '@tool/type';
import type { RunToolSecondParamsType } from '@tool/type/req';
import { createHash } from 'node:crypto';

// Use a minimal interface that works with both Zod v3 and v4
interface ZodSchemaLike<T = unknown> {
  parse: (data: unknown) => T;
}

export const exportTool = <TInput, TOutput>({
  toolCb,
  InputType,
  OutputType,
  config
}: {
  toolCb: (props: TInput, e: RunToolSecondParamsType) => Promise<Record<string, any>>;
  InputType: ZodSchemaLike<TInput>;
  OutputType: ZodSchemaLike<TOutput>;
  config: ToolConfigType;
}) => {
  const cb = async (props: TInput, e: RunToolSecondParamsType) => {
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
    .map((child) => generateToolVersion(child.versionList || []) || '')
    .sort();
  const versionString = childVersions.join('');

  return createHash('sha256').update(versionString).digest('hex').substring(0, 8);
}
