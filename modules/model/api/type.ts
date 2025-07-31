import { z } from 'zod';
import { ModelItemSchema } from '../type';

// 保留原有的 listModelsSchema
export const listModelsSchema = z.array(ModelItemSchema);
export type ListModelsType = z.infer<typeof listModelsSchema>;
