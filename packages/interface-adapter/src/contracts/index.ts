import { ModelContract } from './route/model.contract';
import { PluginContract } from './route/plugin.contract';
import { ToolContract } from './route/tool.contract';
import { WorkflowContract } from './route/workflow.contract';
import type { ContractItemType } from './contract.type';

export default [
  ...Object.values(ModelContract),
  ...Object.values(PluginContract),
  ...Object.values(ToolContract),
  ...Object.values(WorkflowContract)
] satisfies ContractItemType[];
