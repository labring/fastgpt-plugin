import { I18nStringSchema, I18nStringStrictSchema } from '@/type/i18n';
import { z } from 'zod';
import { ToolTypeEnum, VersionListItemSchema } from './tool';
import { InputConfigSchema } from './fastgpt';

// Tool Type List Schema - 移动到这里以避免导入 controller（controller 中有 mongo 依赖）
export const ToolTypeListSchema = z.array(
  z.object({
    type: z.nativeEnum(ToolTypeEnum),
    name: I18nStringStrictSchema
  })
);

export const ToolListItemSchema = z.object({
  id: z.string().describe('The unique id of the tool'),
  parentId: z.string().optional().describe('The parent id of the tool'),
  author: z.string().optional().describe('The author of the tool'),
  courseUrl: z.string().optional().describe('The documentation URL of the tool'),
  name: I18nStringSchema.describe('The name of the tool'),
  avatar: z.string().describe('The icon of the tool'),
  versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
  description: I18nStringSchema.describe('The introduction of the tool'),
  toolDescription: z
    .string()
    .optional()
    .describe(
      'The tool description for ai to use, fallback to English description if not provided'
    ),
  templateType: z.nativeEnum(ToolTypeEnum).describe('The type of the tool'),
  pluginOrder: z.number().describe('The order of the plugin'),
  isActive: z.boolean().describe('Whether it is active'),
  weight: z.number().describe('The weight of the tool'),
  originCost: z.number().describe('The origin cost of the tool'),
  currentCost: z.number().describe('The current cost of the tool'),
  hasTokenFee: z.boolean().describe('Whether it has token fee'),
  secretInputConfig: z
    .array(InputConfigSchema)
    .optional()
    .describe('The secret input list of the tool'),
  toolSource: z.enum(['built-in', 'uploaded']).optional().describe('The source of the tool')
});

export type ToolListItemType = z.infer<typeof ToolListItemSchema>;
