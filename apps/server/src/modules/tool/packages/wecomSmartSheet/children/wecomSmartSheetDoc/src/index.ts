import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  doc_name: z.string(),
  spaceid: z.string().optional().nullable(),
  fatherid: z.string().optional().nullable(),
  admin_users: z.string().optional().nullable()
});

export const OutputType = z.object({
  docid: z.string().optional(),
  url: z.string().optional(),
  result: z.any().optional()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, doc_name, spaceid, fatherid, admin_users } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  const response = await client.post('/wedoc/smartsheet/create_doc', {
    doc_name,
    doc_type: 10, // 10: 智能表格
    spaceid: spaceid || undefined,
    fatherid: fatherid || undefined,
    admin_users: admin_users
      ? admin_users
          .split(',')
          .filter(Boolean)
          .map((u) => u.trim())
      : undefined
  });

  const data = response.data;
  if (data.errcode !== 0) {
    throw new Error(`WeCom API error: ${data.errmsg} (${data.errcode})`);
  }

  return {
    docid: data.docid,
    url: data.url,
    result: data
  };
}
