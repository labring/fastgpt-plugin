import { getErrText } from '@tool/utils/err';
import { z } from 'zod';

export const InputType = z.object({
  apiKey: z.string(),
  query: z.string(),
  freshness: z.string().optional().default('noLimit'),
  summary: z.boolean().optional().default(true),
  include: z.string().optional().default(''),
  exclude: z.string().optional().default(''),
  count: z
    .number()
    .optional()
    .default(10)
    .refine((val) => val >= 1 && val <= 50, {
      message: 'count must be between 1 and 50'
    })
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      id: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
      snippet: z.string().nullable().optional(),
      dateLastCrawled: z.string().nullable().optional(),
      language: z.string().nullable().optional(),
      isNavigational: z.boolean().nullable().optional()
    })
  )
});

export async function tool({
  apiKey,
  query,
  freshness = 'noLimit',
  summary = true,
  include = '',
  exclude = '',
  count = 10
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const response = await fetch('https://api.bochaai.com/v1/web-search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        freshness,
        summary,
        include,
        exclude,
        count
      })
    });

    if (!response.ok) {
      return Promise.reject({
        error: `HTTP错误: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    const searchResults = data?.data?.webPages?.value || [];

    return {
      result: searchResults
    };
  } catch (error) {
    return Promise.reject({
      error: getErrText(error)
    });
  }
}
