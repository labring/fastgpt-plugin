import { InfoString } from '@/type/i18n';
import { z } from 'zod';
import { ToolTypeEnum, VersionListItemSchema } from './tool';
import { InputConfigSchema } from './fastgpt';

export const ToolListItemSchema = z.object({
  id: z.string().describe('The unique id of the tool'),
  parentId: z.string().optional().describe('The parent id of the tool'),
  author: z.string().optional().describe('The author of the tool'),
  courseUrl: z.string().optional().describe('The documentation URL of the tool'),
  name: InfoString.describe('The name of the tool'),
  avatar: z.string().describe('The icon of the tool'),
  versionList: z.array(VersionListItemSchema).min(1).describe('The version list'),
  description: InfoString.describe('The introduction of the tool'),
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
    .describe('The secret input list of the tool')
});
export type ToolListItemType = z.infer<typeof ToolListItemSchema>;
