import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  action: z.enum(['add', 'delete', 'update', 'get']),
  sheet_id: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  need_all_type_sheet: z.boolean().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, action, sheet_id, title, need_all_type_sheet } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let response;
  switch (action) {
    case 'add':
      if (!title) throw new Error('title is required for add action');
      response = await client.post('/wedoc/smartsheet/add_sheet', {
        docid,
        properties: {
          title
        }
      });
      break;
    case 'delete':
      if (!sheet_id) throw new Error('sheet_id is required for delete action');
      response = await client.post('/wedoc/smartsheet/delete_sheet', {
        docid,
        sheet_id
      });
      break;
    case 'update':
      if (!sheet_id) throw new Error('sheet_id is required for update action');
      response = await client.post('/wedoc/smartsheet/update_sheet', {
        docid,
        properties: {
          sheet_id,
          ...(title ? { title } : {})
        }
      });
      break;
    case 'get':
      response = await client.post('/wedoc/smartsheet/get_sheet', {
        docid,
        ...(sheet_id ? { sheet_id } : {}),
        ...(typeof need_all_type_sheet === 'boolean' ? { need_all_type_sheet } : {})
      });
      break;
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  if (response.data.errcode !== 0) {
    throw new Error(`WeCom API Error [${response.data.errcode}]: ${response.data.errmsg}`);
  }

  return {
    result: response.data
  };
}
