import { ConnectionGatewayContract } from './route/connection-gateway.contract';
import { ModelContract } from './route/model.contract';
import { PluginContract } from './route/plugin.contract';
import { PluginDebugSessionContract } from './route/plugin-debug-session.contract';
import { PluginServiceFeatureContract } from './route/plugin-service-feature.contract';
import { ToolContract } from './route/tool.contract';
import { WorkflowContract } from './route/workflow.contract';
import type { ContractItemType } from './contract.type';

export default [
  ...Object.values(ConnectionGatewayContract),
  ...Object.values(ModelContract),
  ...Object.values(PluginContract),
  ...Object.values(PluginDebugSessionContract),
  ...Object.values(PluginServiceFeatureContract),
  ...Object.values(ToolContract),
  ...Object.values(WorkflowContract)
] satisfies ContractItemType[];
