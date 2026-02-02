import { z } from 'zod';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export const InputType = z.object({
  author: z.string(),
  maxResults: z.number().min(1).max(50).default(5),
  sortBy: z.enum(['relevance', 'lastUpdatedDate', 'submittedDate']).default('relevance')
});

export const OutputType = z.object({
  papers: z.array(
    z.object({
      title: z.string().default(''),
      authors: z.array(z.string()).default([]),
      summary: z.string().default(''),
      link: z.string().default(''),
      published: z.string().default('')
    })
  )
});

type ArxivEntry = {
  title?: string;
  author?: { name: string } | { name: string }[];
  summary?: string;
  link?: { $: { href: string; type?: string } } | { $: { href: string; type?: string } }[];
  id?: string;
  published?: string;
};

const getSortBy = (sortBy: string) => sortBy;

const getAuthors = (author: ArxivEntry['author']): string[] => {
  if (!author) return [];
  return Array.isArray(author) ? author.map((a) => a.name) : [author.name];
};

const getLink = (link: ArxivEntry['link'], id?: string): string => {
  if (!link) return id || '';
  if (Array.isArray(link)) {
    const html = link.find((l) => l.$.type === 'text/html');
    return html ? html.$.href : id || '';
  }
  return link.$.href || id || '';
};

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { author, maxResults, sortBy } = props;
  const url = `http://export.arxiv.org/api/query?search_query=au:${encodeURIComponent(author)}&max_results=${maxResults}&sortBy=${getSortBy(sortBy)}`;
  const xml = await (await fetch(url)).text();
  const json = await parseStringPromise(xml, { explicitArray: false });
  const entries: ArxivEntry[] = json.feed.entry
    ? Array.isArray(json.feed.entry)
      ? json.feed.entry
      : [json.feed.entry]
    : [];

  const papers = entries.map((e) => ({
    title: e.title?.trim() ?? '',
    authors: getAuthors(e.author),
    summary: e.summary?.trim() ?? '',
    link: getLink(e.link, e.id),
    published: e.published ?? ''
  }));

  return { papers };
}
