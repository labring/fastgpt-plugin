import type { ToolType } from './type';
import { tools } from './constants';

export function getTool(toolId: string): ToolType | undefined {
  return tools.find((tool) => tool.toolId === toolId);
}
