import type { TemplateListType } from '@domain/entities/workflow.entity';
import type { Result } from '@domain/value-objects/result.vo';

export interface WorkflowManagerPort {
  workflows(): Promise<Result<TemplateListType>>;
}
