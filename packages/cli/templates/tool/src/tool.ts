import type { ToolContextType } from '@fastgpt-plugin/helpers/tools/schemas/req';
import type { Input, Output } from './schemas';

export async function tool(_input: Input, _ctx: ToolContextType): Promise<Output> {
  return { message: 'Hello from {{name}}' };
}
