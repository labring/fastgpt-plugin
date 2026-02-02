import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheet_id: z.string(),
  action: z.enum(['add', 'del', 'update', 'list']),
  view_title: z.string().optional().nullable(),
  view_id: z.string().optional().nullable(),
  view_type: z.string().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, sheet_id, action, view_title, view_id, view_type } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let response;
  switch (action) {
    case 'add': {
      if (!view_title || !view_type) {
        throw new Error('view_title and view_type are required for add action');
      }
      response = await client.post('/wedoc/smartsheet/add_view', {
        docid,
        sheet_id,
        view_title,
        view_type
      });
      break;
    }
    case 'del': {
      if (!view_id) {
        throw new Error('view_id is required for del action');
      }
      response = await client.post('/wedoc/smartsheet/delete_views', {
        docid,
        sheet_id,
        view_ids: [view_id]
      });
      break;
    }
    case 'update': {
      if (!view_id) {
        throw new Error('view_id is required for update action');
      }
      response = await client.post('/wedoc/smartsheet/update_view', {
        docid,
        sheet_id,
        view_id,
        view_title: view_title || undefined
      });
      break;
    }
    case 'list': {
      response = await client.post('/wedoc/smartsheet/get_views', {
        docid,
        sheet_id,
        view_ids: view_id ? [view_id] : undefined
      });
      break;
    }
  }

  return { result: response?.data || {} };
}
