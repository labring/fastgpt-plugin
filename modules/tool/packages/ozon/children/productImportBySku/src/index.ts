import axios from 'axios';
import { z } from 'zod';

export const InputType = z
  .object({
    clientId: z.string(),
    apiKey: z.string(),
    sku: z.number(),
    name: z.string(),
    offer_id: z.string(),
    currency_code: z.enum(['RUB', 'BYN', 'KZT', 'EUR', 'USD', 'CNY']).optional().default('RUB'),
    price: z.number(),
    old_price: z.number().optional(),
    vat: z.enum(['0', '0.05', '0.07', '0.1', '0.2']).optional().default('0')
  })
  .refine((v) => !!v.sku && !!v.name && !!v.offer_id && !!v.price && !!v.vat, {
    message: 'sku, name, offer_id, price and vat are required.'
  });

export const OutputType = z.object({
  task_id: z.string(),
  unmatched_sku_list: z.array(z.any()).default([])
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { clientId, apiKey } = props;

  const payload = {
    items: [
      {
        sku: props.sku,
        offer_id: props.offer_id,
        name: props.name,
        currency_code: props.currency_code ?? 'RUB',
        price: String(props.price),
        old_price: props.old_price !== undefined ? String(props.old_price) : undefined,
        vat: typeof props.vat === 'string' ? Number(props.vat) : props.vat
      }
    ]
  };

  const endpoint = 'https://api-seller.ozon.ru/v1/product/import-by-sku';

  const { data } = await axios.post<{
    result: { task_id: number; unmatched_sku_list: any[] };
  }>(endpoint, payload, {
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return {
    task_id: String(data.result.task_id),
    unmatched_sku_list: data.result.unmatched_sku_list || []
  };
}
