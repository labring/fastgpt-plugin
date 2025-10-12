import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, BitableApp } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  name: z.string().min(1, 'App name cannot be empty').max(100, 'App name too long'),
  folderToken: z.string().optional()
});

export const OutputType = z.object({
  id: z.string(),
  url: z.string().optional()
});

export async function tool({
  appId,
  appSecret,
  name,
  folderToken
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const requestBody: any = { name };
  if (folderToken) {
    requestBody.folder_token = folderToken;
  }

  const response = await client.post<FeishuResponse<{ app: BitableApp }>>(
    '/bitable/v1/apps',
    requestBody
  );
  console.log(response.data);
  const app = response.data.data.app;

  return {
    id: app.app_token,
    url: app.url
  };
}
