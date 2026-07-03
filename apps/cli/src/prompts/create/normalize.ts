import type { DependencyMode, PluginType } from '@fastgpt-plugin/cli/prompts/create/types';

export function normalizePluginType(type?: string): PluginType | undefined {
  if (!type) return undefined;
  return type === 'tool-suite' ? 'tool-suite' : 'tool';
}

export function normalizeDependencyMode(mode?: string): DependencyMode {
  if (!mode || mode === 'semver') return 'semver';
  if (mode === 'catalog') return 'catalog';
  throw new Error(`依赖模式不支持: ${mode}。可选值: semver | catalog`);
}
