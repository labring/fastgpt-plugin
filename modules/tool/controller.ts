import type { ToolType } from './type';
import { tools } from './constants';
import { ToolTypeEnum } from './type/tool';
import { ToolTypeTranslations } from './type/tool';
import z from 'zod';
import { I18nStringStrictSchema } from '@/type/i18n';

export const ToolTypeListSchema = z.array(
  z.object({
    type: z.nativeEnum(ToolTypeEnum),
    name: I18nStringStrictSchema
  })
);

export function getTool(toolId: string): ToolType | undefined {
  return tools.find((tool) => tool.toolId === toolId);
}

export function getToolType(): z.infer<typeof ToolTypeListSchema> {
  return Object.entries(ToolTypeTranslations).map(([type, name]) => ({
    type: type as ToolTypeEnum,
    name
  }));
}
