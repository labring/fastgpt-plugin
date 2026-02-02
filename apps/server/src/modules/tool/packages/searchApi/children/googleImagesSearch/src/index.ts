import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  apiKey: z.string(),
  q: z.string(),
  num: z.number().min(1).max(100).optional().default(20),
  time_period: z
    .enum(['last_hour', 'last_day', 'last_month', 'last_week', 'last_year'])
    .optional()
    .default('last_year')
});

export const OutputType = z.object({
  result: z.any()
});

export async function tool({
  apiKey,
  q,
  num,
  time_period
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { data } = await axios.get<{ images: any[] }>('https://www.searchapi.io/api/v1/search', {
    params: {
      api_key: apiKey,
      engine: 'google_images',
      q,
      num,
      time_period
    }
  });

  return {
    result: data?.images?.map((item) => ({
      title: item.title,
      source: item.source,
      original: item.original,
      thumbnail: item.thumbnail
    }))
  };
}
