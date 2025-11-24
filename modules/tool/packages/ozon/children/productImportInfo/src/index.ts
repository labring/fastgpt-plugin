import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  task_id: z.string()
});

export const OutputType = z.object({
  result: z.object({
    items: z.array(
      z.object({
        offer_id: z.string(),
        product_id: z.number(),
        status: z.string(),
        errors: z.array(z.any()).default([])
      })
    ),
    total: z.number()
  })
});

export async function tool({
  clientId,
  apiKey,
  task_id
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const endpoint = 'https://api-seller.ozon.ru/v1/product/import/info';

  const payload = {
    task_id: Number(task_id)
  };

  const { data } = await axios.post<{
    result: {
      items: {
        offer_id: string;
        product_id: number;
        status: string;
        errors: any[];
      }[];
      total: number;
    };
  }>(endpoint, payload, {
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return {
    result: data.result
  };
}
