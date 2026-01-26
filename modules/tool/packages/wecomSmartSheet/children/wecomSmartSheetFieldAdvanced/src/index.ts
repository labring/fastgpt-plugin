import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheet_id: z.string(),
  action: z.enum(['add', 'del', 'update', 'list']),
  fields: z.array(z.any()).optional().nullable(),
  field_ids: z.array(z.string()).optional().nullable(),
  view_id: z.string().optional().nullable(),
  offset: z.number().optional().nullable(),
  limit: z.number().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, sheet_id, action, fields, field_ids, view_id, offset, limit } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let response;
  switch (action) {
    case 'add': {
      if (!fields) throw new Error('fields array is required for add action');
      response = await client.post('/wedoc/smartsheet/add_fields', {
        docid,
        sheet_id,
        fields
      });
      break;
    }
    case 'del': {
      if (!field_ids) throw new Error('field_ids array is required for del action');
      response = await client.post('/wedoc/smartsheet/delete_fields', {
        docid,
        sheet_id,
        field_ids
      });
      break;
    }
    case 'update': {
      if (!fields) throw new Error('fields array is required for update action');
      response = await client.post('/wedoc/smartsheet/update_fields', {
        docid,
        sheet_id,
        fields
      });
      break;
    }
    case 'list': {
      response = await client.post('/wedoc/smartsheet/get_fields', {
        docid,
        sheet_id,
        view_id,
        offset,
        limit
      });
      break;
    }
  }

  return { result: response?.data || {} };
}
