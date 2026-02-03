import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string().describe('企业微信 access_token，必须具备日程管理权限'),
  action: z
    .enum(['create', 'update', 'delete', 'get'])
    .describe(
      '操作类型：\n- create: 创建新日程\n- update: 修改现有日程\n- delete: 取消/删除日程\n- get: 查询日程详情'
    ),
  schedule_id: z
    .string()
    .optional()
    .describe('日程唯一标识 ID。在 update, delete, get 操作时为必填项'),
  summary: z
    .string()
    .optional()
    .describe('日程标题，最多 128 个字符。create 时建议填写，update 时可选'),
  description: z.string().optional().describe('日程备注描述，最多 512 个字符'),
  start_time: z
    .string()
    .optional()
    .describe('开始时间，格式如 "2026-02-02 15:00:00"。create 时为必填项'),
  end_time: z
    .string()
    .optional()
    .describe('结束时间，格式如 "2026-02-02 16:00:00"。create 时为必填项'),
  attendees: z
    .string()
    .optional()
    .describe('参与者 UserID 列表，多个请用英文逗号 "," 分隔。最多支持 2000 人'),
  location: z.string().optional().describe('日程地点，最多 128 个字符'),
  cal_id: z.string().optional().describe('日历 ID。如果不填，则默认为该用户的默认日历'),
  admins: z
    .string()
    .optional()
    .describe('日程管理员 UserID 列表，逗号分隔。注意：管理员必须在参与人列表中'),
  is_whole_day: z.boolean().optional().describe('是否设置为全天日程。默认为 false'),
  remind_before: z
    .string()
    .optional()
    .describe(
      '提前多久提醒（秒）。如果不填则不提醒。建议值：0 (事件开始时), 300 (5分钟前), 900 (15分钟前), 3600 (1小时前), 86400 (1天前)'
    )
});

export const OutputType = z.object({
  schedule_id: z.string().optional(),
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

// 辅助函数：将时间字符串转换为秒级时间戳
function toTimestamp(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return undefined;
  return Math.floor(date.getTime() / 1000);
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const {
    accessToken,
    action,
    schedule_id,
    summary,
    description,
    start_time,
    end_time,
    attendees,
    location,
    is_whole_day,
    cal_id,
    admins,
    remind_before
  } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let endpoint = '';
  let payload: any = {};

  switch (action) {
    case 'create':
      endpoint = '/oa/schedule/add';
      payload = {
        schedule: {
          summary,
          description,
          start_time: toTimestamp(start_time),
          end_time: toTimestamp(end_time),
          location,
          is_whole_day: is_whole_day ? 1 : 0,
          attendees: attendees ? attendees.split(',').map((id) => ({ userid: id.trim() })) : [],
          cal_id,
          admins: admins ? admins.split(',').map((id) => id.trim()) : undefined,
          reminders:
            remind_before !== undefined && remind_before !== 'undefined'
              ? {
                  is_remind: 1,
                  remind_before_event_secs: parseInt(remind_before)
                }
              : undefined
        }
      };
      break;

    case 'update':
      if (!schedule_id) throw new Error('update 操作必须提供 schedule_id');
      endpoint = '/oa/schedule/update';
      payload = {
        schedule: {
          schedule_id,
          summary,
          description,
          start_time: toTimestamp(start_time),
          end_time: toTimestamp(end_time),
          location,
          is_whole_day: is_whole_day ? 1 : 0,
          attendees: attendees ? attendees.split(',').map((id) => ({ userid: id.trim() })) : [],
          cal_id,
          admins: admins ? admins.split(',').map((id) => id.trim()) : undefined,
          reminders:
            remind_before !== undefined && remind_before !== 'undefined'
              ? {
                  is_remind: 1,
                  remind_before_event_secs: parseInt(remind_before)
                }
              : undefined
        }
      };
      break;

    case 'delete':
      if (!schedule_id) throw new Error('delete 操作必须提供 schedule_id');
      endpoint = '/oa/schedule/del';
      payload = { schedule_id };
      break;

    case 'get':
      if (!schedule_id) throw new Error('get 操作必须提供 schedule_id');
      endpoint = '/oa/schedule/get';
      payload = { schedule_id_list: [schedule_id] };
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
    schedule_id: data.schedule_id || schedule_id,
    result: data
  };
}
