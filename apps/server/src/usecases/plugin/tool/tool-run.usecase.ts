import type { PluginUniqueIdType } from '@fastgpt-plugin/domain/value-objects/plugin.vo';
import type { SystemVarType } from '@fastgpt-plugin/domain/value-objects/system-var.vo';
import type { ToolContextType } from '@fastgpt-plugin/domain/value-objects/tool.vo';

type Deps = {
  pluginManager: pluginMangerPort;
};

type Input = PluginUniqueIdType & {
  input: Record<string, any>;
} & ToolContextType;

export const makeToolRun = (deps: Deps) => async (input: Input) => {};
