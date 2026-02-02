import { z } from 'zod';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export const InputType = z.object({
  arxivId: z.string()
});

export const OutputType = z.object({
  paper: z
    .object({
      title: z.string().default(''),
      authors: z.array(z.string()).default([]),
      summary: z.string().default(''),
      link: z.string().default(''),
      published: z.string().default(''),
      arxivId: z.string().default('')
    })
    .nullable()
});

type ArxivEntry = {
  title?: string;
  author?: { name: string } | { name: string }[];
  summary?: string;
  link?: { $: { href: string; type?: string } } | { $: { href: string; type?: string } }[];
  id?: string;
  published?: string;
};

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

const extractArxivId = (id?: string): string => {
  if (!id) return '';
  // 提取 arxiv id，去掉 URL 前缀
  const match = id.match(/(\d{4}\.\d{4,5}(v\d+)?|\w+-\w+\/\d{7}(v\d+)?)/);
  return match ? match[0] : '';
};

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { arxivId } = props;

  // 支持多种 ArXiv ID 格式
  const cleanId = arxivId.replace(
    /^(arXiv:|http:\/\/arxiv\.org\/abs\/|https:\/\/arxiv\.org\/abs\/)/,
    ''
  );

  const url = `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`;
  const xml = await (await fetch(url)).text();
  const json = await parseStringPromise(xml, { explicitArray: false });

  const entries: ArxivEntry[] = json.feed.entry
    ? Array.isArray(json.feed.entry)
      ? json.feed.entry
      : [json.feed.entry]
    : [];

  if (entries.length === 0) {
    return OutputType.parse({ paper: null });
  }

  const entry = entries[0];
  const paper = {
    title: entry.title?.trim() ?? '',
    authors: getAuthors(entry.author),
    summary: entry.summary?.trim() ?? '',
    link: getLink(entry.link, entry.id),
    published: entry.published ?? '',
    arxivId: extractArxivId(entry.id)
  };

  return { paper };
}
