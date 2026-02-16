import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string()
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      has_entrusted_acceptance: z.boolean().optional(),
      is_rfbs: z.boolean().optional(),
      name: z.string(),
      warehouse_id: z.number(),
      can_print_act_in_advance: z.boolean().optional(),
      first_mile_type: z.object({}).passthrough().optional(),
      has_postings_limit: z.boolean().optional(),
      is_karantin: z.boolean().optional(),
      is_kgt: z.boolean().optional(),
      is_timetable_editable: z.boolean().optional(),
      min_postings_limit: z.number().optional(),
      postings_limit: z.number().optional(),
      min_working_days: z.number().optional(),
      status: z.string().optional(),
      working_days: z.array(z.enum(['1', '2', '3', '4', '5', '6', '7'])).optional()
    })
  )
});

export async function tool({
  clientId,
  apiKey
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const endpoint = 'https://api-seller.ozon.ru/v1/warehouse/list';

  const { data } = await axios.post<{
    result: {
      has_entrusted_acceptance?: boolean;
      is_rfbs?: boolean;
      name: string;
      warehouse_id: number;
      can_print_act_in_advance?: boolean;
      first_mile_type?: Record<string, any>;
      has_postings_limit?: boolean;
      is_karantin?: boolean;
      is_kgt?: boolean;
      is_timetable_editable?: boolean;
      min_postings_limit?: number;
      postings_limit?: number;
      min_working_days?: number;
      status?: string;
      working_days?: ('1' | '2' | '3' | '4' | '5' | '6' | '7')[];
    }[];
  }>(
    endpoint,
    {},
    {
      headers: {
        'Client-Id': clientId,
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  return {
    result: data.result || []
  };
}
