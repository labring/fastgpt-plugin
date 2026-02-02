import { z } from 'zod';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export const InputType = z.object({
  arxivId: z.string()
});

export const OutputType = z.object({
  abstract: z
    .object({
      arxivId: z.string().default(''),
      title: z.string().default(''),
      abstract: z.string().default(''),
      authors: z.array(z.string()).default([]),
      published: z.string().default(''),
      link: z.string().default('')
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

const cleanAbstract = (summary?: string): string => {
  if (!summary) return '';

  // 清理摘要文本：去除多余的空白字符和换行符
  return summary
    .trim()
    .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
    .replace(/\n+/g, ' ') // 将换行符替换为空格
    .replace(/\r/g, '') // 移除回车符
    .trim();
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
    return OutputType.parse({ abstract: null });
  }

  const entry = entries[0];

  // 专注于摘要提取
  const abstract = {
    arxivId: extractArxivId(entry.id),
    title: entry.title?.trim() ?? '',
    abstract: cleanAbstract(entry.summary),
    authors: getAuthors(entry.author),
    published: entry.published ?? '',
    link: getLink(entry.link, entry.id)
  };

  return { abstract };
}
