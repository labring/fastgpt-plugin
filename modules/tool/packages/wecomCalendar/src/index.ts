import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string().describe('企业微信 access_token'),
  action: z.enum(['create', 'update', 'delete', 'get']).describe('操作类型'),
  cal_id: z.string().optional().describe('日历 ID (update, delete, get 时必填)'),
  summary: z.string().optional().describe('日历标题 (create, update 时必填)'),
  color: z.string().optional().describe('日历颜色 (create, update 时必填)'),
  description: z.string().optional().describe('日历描述'),
  shares: z.string().optional().describe('共享成员 UserID 列表，逗号分隔'),
  admins: z
    .string()
    .optional()
    .describe('管理员 UserID 列表，逗号分隔。注意：管理员必须在共享成员列表中')
});

export const OutputType = z.object({
  cal_id: z.string().optional(),
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, action, cal_id, summary, color, description, shares, admins } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let endpoint = '';
  let payload: any = {};

  switch (action) {
    case 'create':
      endpoint = '/oa/calendar/add';
      payload = {
        calendar: {
          summary,
          color,
          description,
          shares: shares ? shares.split(',').map((id) => ({ userid: id.trim() })) : undefined,
          admins: admins ? admins.split(',').map((id) => id.trim()) : undefined
        }
      };
      break;

    case 'update':
      if (!cal_id) throw new Error('update 操作必须提供 cal_id');
      if (!summary || !color) throw new Error('update 操作必须提供 summary 和 color (覆盖式更新)');
      endpoint = '/oa/calendar/update';
      payload = {
        calendar: {
          cal_id,
          summary,
          color,
          description,
          shares: shares ? shares.split(',').map((id) => ({ userid: id.trim() })) : undefined,
          admins: admins ? admins.split(',').map((id) => id.trim()) : undefined
        }
      };
      break;

    case 'delete':
      if (!cal_id) throw new Error('delete 操作必须提供 cal_id');
      endpoint = '/oa/calendar/del';
      payload = { cal_id };
      break;

    case 'get':
      if (!cal_id) throw new Error('get 操作必须提供 cal_id');
      endpoint = '/oa/calendar/get';
      payload = { cal_id_list: [cal_id] };
      break;

    default:
      throw new Error(`不支持的操作类型: ${action}`);
  }

  const response = await client.post(endpoint, payload);
  const data = response.data;

  if (data.errcode !== 0) {
    throw new Error(`WeCom API error: ${data.errmsg} (${data.errcode})`);
  }

  return {
    cal_id: data.cal_id || cal_id,
    result: data
  };
}
