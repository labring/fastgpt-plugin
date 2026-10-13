import { z } from 'zod';

import { TemplateItemSchema } from '@domain/entities/workflow.entity';

export const WorkflowTemplateDTOSchema = z.object(TemplateItemSchema.shape);

export const WorkflowListDTOSchema = z.array(WorkflowTemplateDTOSchema);

export type WorkflowTemplateDTOType = z.infer<typeof WorkflowTemplateDTOSchema>;
export type WorkflowListDTOType = z.infer<typeof WorkflowListDTOSchema>;
