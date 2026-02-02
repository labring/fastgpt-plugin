import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, BitableApp } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required')
});

export const OutputType = z.object({
  name: z.string()
});

export async function tool({
  appId,
  appSecret,
  biTableId
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 获取访问令牌
  const client = await createFeishuClient(appId, appSecret);

  const response = await client.get<FeishuResponse<{ app: BitableApp }>>(
    `/bitable/v1/apps/${biTableId}`
  );

  const app = response.data.data.app;

  return {
    name: app.name || ''
  };
}
