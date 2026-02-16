import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  id_type: z.enum(['sku', 'offer_id']),
  ids: z.array(z.string())
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      sku: z.number().optional(),
      offer_id: z.string().optional(),
      present: z.number(),
      product_id: z.number(),
      reserved: z.number(),
      warehouse_id: z.number(),
      warehouse_name: z.string()
    })
  )
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { clientId, apiKey, id_type, ids } = props;

  const endpoint = 'https://api-seller.ozon.ru/v1/product/info/stocks-by-warehouse/fbs';

  const payload: { sku?: string[]; offer_id?: string[] } =
    id_type === 'sku' ? { sku: ids } : { offer_id: ids };

  const { data } = await axios.post<{
    result: {
      sku?: number;
      offer_id?: string;
      present: number;
      product_id: number;
      reserved: number;
      warehouse_id: number;
      warehouse_name: string;
    }[];
  }>(endpoint, payload, {
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return {
    result: data.result || []
  };
}
