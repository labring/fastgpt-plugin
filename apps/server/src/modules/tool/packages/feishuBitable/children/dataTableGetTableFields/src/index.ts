import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import { buildPaginationParams } from '../../../utils';
import type { FeishuResponse, PagedResponse, Field } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  dataTableId: z.string().min(1, 'Table ID is required')
});

export const OutputType = z.object({
  fields: z.array(
    z.object({
      fieldId: z.string(),
      fieldName: z.string(),
      type: z.number(),
      isPrimary: z.boolean().optional(),
      description: z.any().optional()
    })
  )
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const params = buildPaginationParams(100);

  const response = await client.get<FeishuResponse<PagedResponse<Field>>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/fields`,
    { params }
  );

  const data = response.data.data;

  return {
    fields: data.items.map((field) => ({
      fieldId: field.field_id,
      fieldName: field.field_name,
      type: field.type,
      isPrimary: field.is_primary,
      description: field.description
    }))
  };
}
