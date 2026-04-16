import { z } from '@hono/zod-openapi';

import { TemplateItemSchema } from '@domain/entities/workflow.entity';

export const WorkflowTemplateDTOSchema = z.object(TemplateItemSchema.shape).openapi({
  description: 'Workflow template'
});

export const WorkflowListDTOSchema = z.array(WorkflowTemplateDTOSchema).openapi({
  description: 'Workflow template list'
});

export type WorkflowTemplateDTOType = z.infer<typeof WorkflowTemplateDTOSchema>;
export type WorkflowListDTOType = z.infer<typeof WorkflowListDTOSchema>;
