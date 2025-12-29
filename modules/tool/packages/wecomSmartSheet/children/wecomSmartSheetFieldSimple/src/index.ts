import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheet_id: z.string(),
  action: z.enum(['add', 'del', 'update', 'list']),
  field_title: z.string().optional().nullable(),
  new_field_title: z.string().optional().nullable(),
  field_type: z.string().optional().nullable(),
  options: z.string().optional().nullable(),
  decimal_places: z.number().optional().nullable()
});

export const OutputType = z.object({
  result: z.any()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const {
    accessToken,
    docid,
    sheet_id,
    action,
    field_title,
    new_field_title,
    field_type,
    options,
    decimal_places
  } = props;

  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  const getFieldIdByTitle = async (title: string): Promise<string | null> => {
    const res = await client.post('/wedoc/smartsheet/get_fields', {
      docid,
      sheet_id
    });
    const field = res.data.fields?.find((f: any) => f.field_title === title);
    return field ? field.field_id : null;
  };

  let response;
  switch (action) {
    case 'add': {
      if (!field_title) throw new Error('field_title is required for add action');
      const type = field_type || 'FIELD_TYPE_TEXT';
      const field: any = {
        field_title,
        field_type: type
      };

      // Construct property based on type
      if (type === 'FIELD_TYPE_NUMBER') {
        field.property_number = {
          decimal_places: decimal_places ?? 0,
          use_separate: true
        };
      } else if (type === 'FIELD_TYPE_DATE_TIME') {
        field.property_date_time = {
          format: 'yyyy/MM/dd',
          auto_fill: false
        };
      } else if (type === 'FIELD_TYPE_SINGLE_SELECT') {
        field.property_single_select = {
          options: (options || '')
            .split(',')
            .filter(Boolean)
            .map((t) => ({ text: t.trim() }))
        };
      } else if (type === 'FIELD_TYPE_SELECT') {
        field.property_select = {
          options: (options || '')
            .split(',')
            .filter(Boolean)
            .map((t) => ({ text: t.trim() }))
        };
      } else if (type === 'FIELD_TYPE_CHECKBOX') {
        field.property_checkbox = {
          checked: false
        };
      } else if (type === 'FIELD_TYPE_RATING') {
        field.property_rating = {
          max: 5,
          symbol: 'star'
        };
      }

      response = await client.post('/wedoc/smartsheet/add_fields', {
        docid,
        sheet_id,
        fields: [field]
      });
      break;
    }
    case 'del': {
      if (!field_title) throw new Error('field_title is required for del action');
      const id = await getFieldIdByTitle(field_title);
      if (!id) throw new Error(`Field with title "${field_title}" not found`);

      response = await client.post('/wedoc/smartsheet/delete_fields', {
        docid,
        sheet_id,
        field_ids: [id]
      });
      break;
    }
    case 'update': {
      if (!field_title || !new_field_title)
        throw new Error(
          'field_title (old name) and new_field_title are required for update action'
        );

      const id = await getFieldIdByTitle(field_title);
      if (!id) throw new Error(`Field with title "${field_title}" not found`);

      response = await client.post('/wedoc/smartsheet/update_fields', {
        docid,
        sheet_id,
        fields: [
          {
            field_id: id,
            field_title: new_field_title
          }
        ]
      });
      break;
    }
    case 'list': {
      response = await client.post('/wedoc/smartsheet/get_fields', {
        docid,
        sheet_id
      });
      break;
    }
  }

  return { result: response?.data || {} };
}
