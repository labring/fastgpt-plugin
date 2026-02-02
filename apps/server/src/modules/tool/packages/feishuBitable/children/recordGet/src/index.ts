import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import type { FeishuResponse, BitableRecord } from '../../../types';

export const InputType = z.object({
  appId: z.string().nonempty('App ID is required'),
  appSecret: z.string().nonempty('App Secret is required'),
  biTableId: z.string().nonempty('BiTable ID is required'),
  dataTableId: z.string().nonempty('Table ID is required'),
  recordId: z.string().nonempty('Record ID is required')
});

export const OutputType = z.object({
  recordId: z.string(),
  fields: z.record(z.string(), z.any())
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId,
  recordId
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const response = await client.get<FeishuResponse<{ record: BitableRecord }>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/records/${recordId}`
  );

  const record = response.data.data.record;

  return {
    recordId: record.record_id,
    fields: record.fields
  };
}
