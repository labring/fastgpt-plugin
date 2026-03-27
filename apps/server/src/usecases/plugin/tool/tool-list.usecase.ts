import type { ToolType } from '@fastgpt-plugin/domain/entities/tool.entity';
import { type PluginPort } from '@fastgpt-plugin/domain/ports/plugin.port';

type Deps = {
  toolRepo: PluginPort<ToolType>;
};

type Input = object;

export const makeGetToolList = (deps: Deps) => async (_input: Input) => {
  const list = await deps.toolRepo.listAll();
  return list;
};
