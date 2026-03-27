// import { ToolSchema, type ToolType } from '@fastgpt-plugin/domain/entities/tool.entity';
// import { PluginRepo } from './plugin.repo';
// import { PluginTypeEnum } from '@fastgpt-plugin/domain/entities/plugin.entity';

// export class ToolRepo extends PluginRepo<ToolType, typeof ToolSchema> {
//   constructor() {
//     super(ToolSchema);
//   }

//   async getAllTools(): Promise<ToolType[]> {
//     return this.getByType(PluginTypeEnum.tool);
//   }
// }
