import type { ToolType } from '@fastgpt-plugin/domain/entities/tool.entity';
import type { PluginPort } from '@fastgpt-plugin/domain/ports/plugin.port';

type Deps = {
  toolRepo: PluginPort<ToolType>;
};

type Input = {
  pluginId: string;
};

export const makeGetToolAllVersion = (deps: Deps) => async (input: Input) => {
  return deps.toolRepo.search(input);
};
