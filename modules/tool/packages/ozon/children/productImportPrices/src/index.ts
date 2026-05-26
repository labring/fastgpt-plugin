import axios from 'axios';
import { z } from 'zod';

export const InputType = z.object({
  clientId: z.string(),
  apiKey: z.string(),
  offer_id: z.string().optional(),
  product_id: z.number(),
  currency_code: z.enum(['RUB', 'BYN', 'KZT', 'EUR', 'USD', 'CNY']).optional().default('RUB'),
  price: z.string(),
  old_price: z.string().optional().default('0'),
  vat: z.enum(['0', '0.05', '0.07', '0.1', '0.2']).optional(),
  net_price: z.string().optional(),
  min_price: z.string().optional(),
  manage_elastic_boosting_through_price: z.boolean().optional().default(false),
  min_price_for_auto_actions_enabled: z.boolean().optional().default(false),
  auto_action_enabled: z.enum(['UNKNOWN', 'ENABLED', 'DISABLED']).optional().default('UNKNOWN'),
  price_strategy_enabled: z.enum(['UNKNOWN', 'ENABLED', 'DISABLED']).optional().default('UNKNOWN')
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      product_id: z.number(),
      offer_id: z.string(),
      updated: z.boolean(),
      errors: z.array(z.any()).default([])
    })
  )
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const {
    clientId,
    apiKey,
    offer_id,
    product_id,
    currency_code,
    price,
    old_price,
    vat,
    net_price,
    min_price,
    manage_elastic_boosting_through_price,
    min_price_for_auto_actions_enabled,
    auto_action_enabled,
    price_strategy_enabled
  } = props;

  const endpoint = 'https://api-seller.ozon.ru/v1/product/import/prices';

  const payload = {
    prices: [
      {
        ...(offer_id ? { offer_id } : {}),
        product_id,
        currency_code,
        price,
        old_price,
        vat,
        net_price,
        min_price,
        manage_elastic_boosting_through_price,
        min_price_for_auto_actions_enabled,
        auto_action_enabled,
        price_strategy_enabled
      }
    ]
  };

  const { data } = await axios.post<{
    result: {
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
