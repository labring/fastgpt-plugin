import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import { buildPaginationParams, parseJsonSafely } from '../../../utils';
import type { FeishuResponse, BitableRecord, PagedResponse, Field } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required'),
  dataTableId: z.string().min(1, 'Table ID is required'),
  fields: z.string().min(1, 'Fields data cannot be empty')
});

export const OutputType = z.object({
  recordId: z.string()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId,
  fields
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const addFieldData = parseJsonSafely(fields);

  // Get field
  const {
    data: { data: fieldsData }
  } = await client.get<FeishuResponse<PagedResponse<Field>>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/fields`,
    { params: buildPaginationParams(100) }
  );

  // Remove invalid field
  for (const key in addFieldData) {
    if (!fieldsData.items?.find((item) => item.field_name === key)) {
      delete addFieldData[key];
    }
  }

  const response = await client.post<FeishuResponse<{ record: BitableRecord }>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/records`,
    { fields: addFieldData }
  );

  const record = response.data.data.record;

  return {
    recordId: record.record_id
  };
}
