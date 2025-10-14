import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  dataTableId: z.string().min(1, 'Table ID is required')
});

export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 获取访问令牌
  const client = await createFeishuClient(appId, appSecret);

  await client.delete<FeishuResponse>(`/bitable/v1/apps/${biTableId}/tables/${dataTableId}`);

  return {
    success: true
  };
}
