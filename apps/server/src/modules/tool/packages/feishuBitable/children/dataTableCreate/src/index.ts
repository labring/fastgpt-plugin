import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  tableName: z.string().min(1, 'Table name cannot be empty').max(100, 'Table name too long')
});

export const OutputType = z.object({
  dataTableId: z.string()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  tableName
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const response = await client.post<FeishuResponse<{ table_id: string }>>(
    `/bitable/v1/apps/${biTableId}/tables`,
    { table: { name: tableName } }
  );

  return {
    dataTableId: response.data.data.table_id
  };
}
