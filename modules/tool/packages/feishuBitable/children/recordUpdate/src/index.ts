import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import { parseJsonSafely } from '../../../utils';
import type { FeishuResponse, BitableRecord } from '../../../types';

export const InputType = z.object({
  appId: z.string().nonempty('App ID is required'),
  appSecret: z.string().nonempty('App Secret is required'),
  biTableId: z.string().nonempty('BiTable ID is required'),
  dataTableId: z.string().nonempty('Table ID is required'),
  recordId: z.string().nonempty('Record ID is required'),
  fields: z.string().nonempty('Fields data cannot be empty')
});

export const OutputType = z.object({
  success: z.boolean()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId,
  recordId,
  fields
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const fieldsData = parseJsonSafely(fields);

  const response = await client.put<FeishuResponse<{ record: BitableRecord }>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/records/${recordId}`,
    { fields: fieldsData }
  );

  const record = response.data.data.record;

  return {
    success: true
  };
}
