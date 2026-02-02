import { z } from 'zod';
import Perplexity from '@perplexity-ai/perplexity_ai';

export const InputType = z.object({
  apiKey: z.string(),
  query: z.string(),
  max_results: z.number().min(1).max(20).optional().default(10)
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string()
    })
  )
});

export async function tool({
  apiKey,
  query,
  max_results
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const client = new Perplexity({ apiKey });

  const search = await client.search.create({
    query,
    max_results
  });

  return {
    result: search.results.map((item) => ({
      title: item.title,
      url: item.url,
      snippet: item.snippet
    }))
  };
}
