import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, BitableApp } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  name: z.string().min(1, 'App name cannot be empty').max(100, 'App name too long')
});

export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  name
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);
  console.log(biTableId, name, 2232);
  await client.put<FeishuResponse<{ app: BitableApp }>>(`/bitable/v1/apps/${biTableId}`, { name });

  return {
    success: true
  };
}
