import type { ToolType } from './type';
import { tools } from './constants';
import type { ToolTypeEnum } from './type/tool';
import { ToolTypeTranslations } from './type/tool';

export function getTool(toolId: string): ToolType | undefined {
  return tools.find((tool) => tool.toolId === toolId);
}

export function getToolType(): Array<{
  type: ToolTypeEnum;
  name: { en: string; 'zh-CN': string; 'zh-Hant': string };
}> {
  return Object.entries(ToolTypeTranslations).map(([type, name]) => ({
    type: type as ToolTypeEnum,
    name
  }));
}
