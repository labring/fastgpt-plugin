import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  apiKey: z.string(),
  q: z.string(),
  num: z.number().min(1).max(100).optional().default(20)
});

export const OutputType = z.object({
  result: z.any()
});

export async function tool({
  apiKey,
  q,
  num
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { data } = await axios.get<{ organic_results: any[] }>(
    'https://www.searchapi.io/api/v1/search',
    {
      params: {
        api_key: apiKey,
        engine: 'baidu',
        q,
        num
      }
    }
  );

  return {
    result: data?.organic_results?.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      snippet_highlighted_words: item.snippet_highlighted_words
    }))
  };
}
