import { z } from 'zod';
import * as cheerio from 'cheerio';

export const InputType = z.object({
  query: z.string(),
  url: z.string()
});

export const OutputType = z.object({
  result: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      snippet: z.string()
    })
  )
});

export async function tool({
  query,
  url
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    const response = await fetch(`${url}?q=${encodeURIComponent(query)}&language=auto`);
    const html = await response.text();
    const $ = cheerio.load(html, {
      xml: false
    });

    const results: z.infer<typeof OutputType>['result'] = [];

    $('.result').each((_: number, element) => {
      const $element = $(element);
      results.push({
        title: $element.find('h3').text().trim(),
        link: $element.find('a').first().attr('href') || '',
        snippet: $element.find('.content').text().trim()
      });
    });

    if (results.length === 0) {
      return Promise.reject({
        error: 'No search results'
      });
    }

    return {
      result: results.slice(0, 10)
    };
  } catch (error) {
    return Promise.reject({ error });
  }
}
