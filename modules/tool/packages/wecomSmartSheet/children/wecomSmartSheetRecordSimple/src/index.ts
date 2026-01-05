import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheet_id: z.string(),
  action: z.enum(['add', 'del', 'update', 'list']),
  data: z.record(z.any()).optional().nullable(),
  record_id: z.string().optional().nullable(),
  limit: z.number().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, sheet_id, action, data, record_id, limit } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  // Helper to fetch field types to know how to transform
  const getFieldInfo = async () => {
    const res = await client.post('/wedoc/smartsheet/get_fields', {
      docid,
      sheet_id
    });
    const info: Record<string, string> = {};
    res.data.fields?.forEach((f: any) => {
      info[f.field_title] = f.field_type;
    });
    return info;
  };

  const transformValue = (value: any, fieldType: string) => {
    if (fieldType === 'FIELD_TYPE_TEXT' || fieldType === 'FIELD_TYPE_URL') {
      if (typeof value === 'string') {
        return [{ type: 'text', text: value }];
      }
    }
    // Most other types like NUMBER, CHECKBOX, DATE (timestamp) can be passed directly
    return value;
  };

  const transformData = async (dataObj: Record<string, any>) => {
    const fieldInfo = await getFieldInfo();
    const values: Record<string, any> = {};
    for (const [title, value] of Object.entries(dataObj)) {
      const type = fieldInfo[title] || 'FIELD_TYPE_TEXT';
      values[title] = transformValue(value, type);
    }
    return values;
  };

  let response;
  switch (action) {
    case 'add': {
      if (!data) throw new Error('data is required for add action');
      const transformedValues = await transformData(data);
      response = await client.post('/wedoc/smartsheet/add_records', {
        docid,
        sheet_id,
        key_type: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE',
        records: [{ values: transformedValues }]
      });
      break;
    }
    case 'update': {
      if (!data || !record_id) throw new Error('data and record_id are required for update action');
      const transformedValues = await transformData(data);
      response = await client.post('/wedoc/smartsheet/update_records', {
        docid,
        sheet_id,
        key_type: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE',
        records: [
          {
            record_id,
            values: transformedValues
          }
        ]
      });
      break;
    }
    case 'del': {
      if (!record_id) throw new Error('record_id is required for del action');
      response = await client.post('/wedoc/smartsheet/delete_records', {
        docid,
        sheet_id,
        record_ids: [record_id]
      });
      break;
    }
    case 'list': {
      response = await client.post('/wedoc/smartsheet/get_records', {
        docid,
        sheet_id,
        limit: limit || 10,
        key_type: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE'
      });
      break;
    }
  }

  return { result: response?.data || {} };
}
