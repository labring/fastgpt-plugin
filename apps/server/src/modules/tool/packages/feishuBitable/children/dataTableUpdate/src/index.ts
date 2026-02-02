import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, Table } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  dataTableId: z.string().min(1, 'Table ID is required'),
  name: z.string().min(1, 'Table name cannot be empty').max(100, 'Table name too long')
});

export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId,
  name
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  await client.patch<FeishuResponse<{ table: Table }>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}`,
    { name }
  );

  return {
    success: true
  };
}
