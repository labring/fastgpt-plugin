import { z } from 'zod';

import { I18nStringSchema } from '../value-objects/i18n-string.vo';

export const WorkflowInputSchema = z.looseObject({
  label: I18nStringSchema,
  description: I18nStringSchema.optional(),
  placeholder: I18nStringSchema.optional(),
  toolDescription: I18nStringSchema.optional(),
  debugLabel: I18nStringSchema.optional(),
  valueDesc: I18nStringSchema.optional()
});

export const WorkflowOutputSchema = z.looseObject({
  label: I18nStringSchema,
  description: I18nStringSchema.optional(),
  valueDesc: I18nStringSchema.optional()
});

export const WorkflowNodeSchema = z.looseObject({
  name: I18nStringSchema,
  intro: I18nStringSchema,
  inputs: z.array(WorkflowInputSchema).optional(),
  outputs: z.array(WorkflowOutputSchema).optional()
});

export const TemplateItemSchema = z.object({
  templateId: z.string().describe('The unique id of the template'),
  name: I18nStringSchema.describe('The name of the template'),
  intro: I18nStringSchema.describe('The introduction of the template'),
  avatar: z.string().describe('The icon of the template'),
  tags: z.array(z.string()).describe('The tags of the template'),
  type: z.string().describe('The type of the template'),
  author: z.string().optional().describe('The author of the template'),
  isActive: z.boolean().optional().describe('Whether it is active'),
  userGuide: z
    .union([
      z.string(),
      z.object({
        type: z.string(),
        content: z.string()
      })
    ])
    .optional()
    .describe('The user guide of the template'),
  isQuickTemplate: z.boolean().optional().describe('Whether it is a quick template'),
  order: z.number().optional().describe('The order of the template'),
  weight: z.number().optional().describe('The weight of the template'),
  workflow: z.looseObject({
    nodes: z.array(WorkflowNodeSchema).describe('The nodes of the template'),
    edges: z.array(z.unknown()).describe('The edges of the template'),
    chatConfig: z.unknown().optional().describe('The chat config of the template')
  })
});

export const TemplateListSchema = z.array(TemplateItemSchema);

export type WorkflowInputType = z.infer<typeof WorkflowInputSchema>;
export type WorkflowOutputType = z.infer<typeof WorkflowOutputSchema>;
export type WorkflowNodeType = z.infer<typeof WorkflowNodeSchema>;
export type TemplateItemType = z.infer<typeof TemplateItemSchema>;
export type TemplateListType = z.infer<typeof TemplateListSchema>;
