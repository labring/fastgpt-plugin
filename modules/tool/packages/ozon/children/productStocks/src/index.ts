import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  offer_id: z.string().optional(),
  product_id: z.number(),
  stock: z.number(),
  warehouse_id: z.number()
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      warehouse_id: z.number(),
      product_id: z.number(),
      offer_id: z.string(),
      updated: z.boolean(),
      errors: z.array(z.any()).default([])
    })
  )
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { clientId, apiKey, offer_id, product_id, stock, warehouse_id } = props;

  const endpoint = 'https://api-seller.ozon.ru/v2/products/stocks';

  const payload = {
    stocks: [
      {
        ...(offer_id ? { offer_id } : {}),
        product_id,
        stock,
        warehouse_id
      }
    ]
  };

  const { data } = await axios.post<{
    result: {
      warehouse_id: number;
      product_id: number;
      offer_id: string;
      updated: boolean;
      errors: any[];
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
