import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  attributes: z.array(z.any()).default([]),
  offer_id: z.string()
});

export const OutputType = z.object({
  task_id: z.number()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { clientId, apiKey, attributes, offer_id } = props;

  const endpoint = 'https://api-seller.ozon.ru/v1/product/attributes/update';

  const payload = {
    items: [
      {
        offer_id,
        attributes
      }
    ]
  };

  const { data } = await axios.post<{ task_id: number }>(endpoint, payload, {
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return {
    task_id: data.task_id
  };
}
