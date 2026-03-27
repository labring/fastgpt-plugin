import type { ToolType } from '@fastgpt-plugin/domain/entities/tool.entity';
import type { PluginPort } from '@fastgpt-plugin/domain/ports/plugin.port';
import type { PluginUniqueIdType } from '@fastgpt-plugin/domain/value-objects/plugin.vo';

type Deps = {
  toolRepo: PluginPort<ToolType>;
};

type Input = PluginUniqueIdType;

export const makeGetTool = (deps: Deps) => async (input: Input) => {
  return deps.toolRepo.search(input);
};
