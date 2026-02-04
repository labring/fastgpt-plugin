import type { PluginType } from '@fastgpt-plugin/cli/prompts/create/types';

export function normalizePluginType(type?: string): PluginType | undefined {
  if (!type) return undefined;
  return type === 'tool-suite' ? 'tool-suite' : 'tool';
}
