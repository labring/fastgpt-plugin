import { z } from 'zod';

export const TemplateItemSchema = z.object({
  templateId: z.string().describe('The unique id of the template'),
  name: z.string().describe('The name of the template'),
  intro: z.string().describe('The introduction of the template'),
  avatar: z.string().describe('The icon of the template'),
  tags: z.array(z.string()).describe('The tags of the template'),
  type: z.string().describe('The type of the template'),
  author: z.string().optional().describe('The author of the template'),
  isActive: z.boolean().optional().describe('Whether it is active'),
  userGuide: z.string().optional().describe('The user guide of the template'),
  isQuickTemplate: z.boolean().optional().describe('Whether it is a quick template'),
  order: z.number().optional().describe('The order of the template'),
  weight: z.number().optional().describe('The weight of the template'),
  workflow: z.object({
    nodes: z.array(z.any()).describe('The nodes of the template'),
    edges: z.array(z.any()).describe('The edges of the template'),
    chatConfig: z.any().optional().describe('The chat config of the template')
  })
});

export const TemplateListSchema = z.array(TemplateItemSchema);

export type TemplateItemType = z.infer<typeof TemplateItemSchema>;
export type TemplateListType = z.infer<typeof TemplateListSchema>;
