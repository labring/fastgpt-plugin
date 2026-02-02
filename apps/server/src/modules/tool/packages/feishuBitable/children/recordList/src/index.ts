import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import { buildPaginationParams, parseJsonSafely } from '../../../utils';
import type { FeishuResponse, PagedResponse, BitableRecord } from '../../../types';

export const InputType = z.object({
  appId: z.string().nonempty('App ID is required'),
  appSecret: z.string().nonempty('App Secret is required'),
  biTableId: z.string().nonempty('BiTable ID is required'),
  dataTableId: z.string().nonempty('Table ID is required'),
  pageSize: z.number().int().min(1).max(500).optional().default(100),
  pageToken: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional()
});

export const OutputType = z.object({
  records: z.array(
    z.object({
      recordId: z.string(),
      fields: z.record(z.string(), z.any())
    })
  ),
  hasMore: z.boolean(),
  pageToken: z.string().optional(),
  total: z.number()
});

export async function tool({
  appId,
  appSecret,
  biTableId,
  dataTableId,
  pageSize = 20,
  pageToken,
  filter,
  sort
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const params = buildPaginationParams(pageSize, pageToken);

  if (filter) {
    params.filter = filter;
  }

  if (sort) {
    const sortArray = parseJsonSafely(sort);
    params.sort = JSON.stringify(sortArray);
  }

  const response = await client.get<FeishuResponse<PagedResponse<BitableRecord>>>(
    `/bitable/v1/apps/${biTableId}/tables/${dataTableId}/records`,
    { params }
  );

  const data = response.data.data;

  return {
    records:
      data.items?.map((record) => ({
        recordId: record.record_id,
        fields: record.fields
      })) || [],
    hasMore: data.has_more,
    pageToken: data.page_token,
    total: data.total || data.items?.length || 0
  };
}
