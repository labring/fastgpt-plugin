import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheet_id: z.string(),
  action: z.enum(['add', 'del', 'update', 'list']),
  records: z.array(z.any()).optional().nullable(),
  record_ids: z.array(z.string()).optional().nullable(),
  query_params: z.record(z.any()).optional().nullable(),
  key_type: z.string().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, sheet_id, action, records, record_ids, query_params, key_type } =
    props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let response;
  switch (action) {
    case 'add': {
      if (!records) throw new Error('records array is required for add action');
      response = await client.post('/wedoc/smartsheet/add_records', {
        docid,
        sheet_id,
        key_type: key_type || 'CELL_VALUE_KEY_TYPE_FIELD_TITLE',
        records
      });
      break;
    }
    case 'update': {
      if (!records) throw new Error('records array is required for update action');
      response = await client.post('/wedoc/smartsheet/update_records', {
        docid,
        sheet_id,
        key_type: key_type || 'CELL_VALUE_KEY_TYPE_FIELD_TITLE',
        records
      });
      break;
    }
    case 'del': {
      if (!record_ids) throw new Error('record_ids array is required for del action');
      response = await client.post('/wedoc/smartsheet/delete_records', {
        docid,
        sheet_id,
        record_ids
      });
      break;
    }
    case 'list': {
      response = await client.post('/wedoc/smartsheet/get_records', {
        docid,
        sheet_id,
        key_type: key_type || 'CELL_VALUE_KEY_TYPE_FIELD_TITLE',
        ...query_params
      });
      break;
    }
  }

  return { result: response?.data || {} };
}
