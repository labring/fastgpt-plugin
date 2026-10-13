import { z } from 'zod';

import {
  TemplateItemSchema,
  WorkflowInputSchema,
  WorkflowNodeSchema,
  WorkflowOutputSchema
} from '@domain/entities/workflow.entity';

export const WorkflowInputDTOSchema = WorkflowInputSchema;
export const WorkflowOutputDTOSchema = WorkflowOutputSchema;
export const WorkflowNodeDTOSchema = WorkflowNodeSchema;
export const WorkflowTemplateDTOSchema = TemplateItemSchema;

export const WorkflowListDTOSchema = z.array(WorkflowTemplateDTOSchema);

export type WorkflowInputDTOType = z.infer<typeof WorkflowInputDTOSchema>;
export type WorkflowOutputDTOType = z.infer<typeof WorkflowOutputDTOSchema>;
export type WorkflowNodeDTOType = z.infer<typeof WorkflowNodeDTOSchema>;
export type WorkflowTemplateDTOType = z.infer<typeof WorkflowTemplateDTOSchema>;
export type WorkflowListDTOType = z.infer<typeof WorkflowListDTOSchema>;
