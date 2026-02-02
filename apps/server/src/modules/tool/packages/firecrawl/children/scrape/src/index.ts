import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

export const InputType = z.object({
  apiUrl: z.string().optional().default('https://api.firecrawl.dev'),
  apiKey: z.string(),
  url: z.string(),
  format: z.enum(['markdown', 'html']).optional().default('markdown'),
  faster: z.boolean().optional().default(true)
});

export const OutputType = z.object({
  result: z.string()
});

export async function tool({
  apiUrl,
  apiKey,
  url,
  format,
  faster
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const app = new FirecrawlApp({ apiUrl, apiKey });

  const scrapeResult = await app.scrapeUrl(url, {
    formats: [format],
    maxAge: faster ? 3600000 : 0 // 1 hour in milliseconds
  });

  if (scrapeResult.success) {
    const result = scrapeResult.markdown || scrapeResult.html;

    if (!result) {
      return Promise.reject("Can't fetch content from url");
    }
    return {
      result
    };
  } else {
    return Promise.reject(scrapeResult.error);
  }
}
