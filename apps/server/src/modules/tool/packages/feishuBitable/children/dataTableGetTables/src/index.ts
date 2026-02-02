import { z } from 'zod';
import { createFeishuClient } from '../../../client';
import { buildPaginationParams } from '../../../utils';
import type { FeishuResponse, PagedResponse, Table } from '../../../types';

export const InputType = z.object({
  appId: z.string().min(1, 'App ID is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
  biTableId: z.string().min(1, 'BiTable ID is required')
});

export const OutputType = z.object({
  tables: z.array(
    z.object({
      dataTableId: z.string(),
      name: z.string(),
      revision: z.number().optional()
    })
  )
});

export async function tool({
  appId,
  appSecret,
  biTableId
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = await createFeishuClient(appId, appSecret);

  const params = buildPaginationParams(100);

  const response = await client.get<FeishuResponse<PagedResponse<Table>>>(
    `/bitable/v1/apps/${biTableId}/tables`,
    { params }
  );

  const data = response.data.data;

  return {
    tables: data.items.map((table) => ({
      dataTableId: table.table_id,
      name: table.name,
      revision: table.revision
    }))
  };
}
