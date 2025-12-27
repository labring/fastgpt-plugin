import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  product_ids: z.array(z.string())
});

export const OutputType = z.object({
  result: z.any()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { clientId, apiKey, product_ids } = props;

  const endpoint = 'https://api-seller.ozon.ru/v1/barcode/generate';

  const payload = { product_ids };

  const { data } = await axios.post(endpoint, payload, {
    headers: {
      'Client-Id': clientId,
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return { result: data };
}
