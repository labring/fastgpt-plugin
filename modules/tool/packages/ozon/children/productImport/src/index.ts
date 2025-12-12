import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  offer_id: z.string(),
  name: z.string(),
  attributes: z.array(z.any()),
  images: z.array(z.string()),
  barcode: z.string().optional(),
  description_category_id: z.number(),
  type_id: z.number(),
  currency_code: z.enum(['RUB', 'BYN', 'KZT', 'EUR', 'USD', 'CNY']).default('RUB'),
  price: z.string(),
  old_price: z.string().optional(),
  vat: z.enum(['0', '0.05', '0.07', '0.1', '0.2']),
  dimension_unit: z.enum(['mm', 'cm', 'in']).default('cm'),
  depth: z.number(),
  height: z.number(),
  width: z.number(),
  weight_unit: z.enum(['g', 'kg', 'lb']).default('kg'),
  weight: z.number()
});

export const OutputType = z.object({
  task_id: z.number()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const {
    clientId,
    apiKey,
    offer_id,
    name,
    attributes,
    images,
    barcode,
    description_category_id,
    type_id,
    currency_code,
    price,
    old_price,
    dimension_unit,
    depth,
    height,
    width,
    weight_unit,
    weight,
    vat
  } = props;

  const endpoint = 'https://api-seller.ozon.ru/v3/product/import';

  const payload = {
    items: [
      {
        offer_id,
        name,
        attributes,
        images: images.map((url) => ({ url })),
        barcode,
        description_category_id,
        type_id,
        currency_code,
        price,
        old_price,
        vat,
        dimension_unit,
        depth,
        height,
        width,
        weight_unit,
        weight
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
