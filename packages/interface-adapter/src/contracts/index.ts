import type { ContractItemType } from './contract.type';
import { ModelContract } from './route/model.contract';
import { PluginContract } from './route/plugin.contract';
import { ToolRunContract } from './route/tool.contract';
import { WorkflowContract } from './route/workflow.contract';

export default [
  ...Object.values(ModelContract),
  ...Object.values(PluginContract),
  ToolRunContract,
  ...Object.values(WorkflowContract)
] satisfies ContractItemType[];
