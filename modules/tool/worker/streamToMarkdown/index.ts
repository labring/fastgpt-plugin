import { parentPort } from 'worker_threads';
import { workerResponse } from '@tool/worker/utils';
import { html2md } from '../htmlToMarkdown/utils';
import * as cheerio from 'cheerio';

export const cheerioToHtml = ({
  fetchUrl,
  $,
  selector
}: {
  fetchUrl: string;
  $: cheerio.CheerioAPI;
  selector?: string;
}) => {
  // get origin url
  const originUrl = new URL(fetchUrl).origin;
  const protocol = new URL(fetchUrl).protocol; // http: or https:

  const usedSelector = selector || 'body';
  const selectDom = $(usedSelector);

  // remove i element
  selectDom.find('i,script,style').remove();

  // remove empty a element
  selectDom
    .find('a')
    .filter((i, el) => {
      return $(el).text().trim() === '' && $(el).children().length === 0;
    })
    .remove();

  // if link,img startWith /, add origin url
  selectDom.find('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      if (href.startsWith('//')) {
        $(el).attr('href', protocol + href);
      } else if (href.startsWith('/')) {
        $(el).attr('href', originUrl + href);
      }
    }
  });
  selectDom.find('img, video, source, audio, iframe').each((i, el) => {
    const src = $(el).attr('src');
    if (src) {
      if (src.startsWith('//')) {
        $(el).attr('src', protocol + src);
      } else if (src.startsWith('/')) {
        $(el).attr('src', originUrl + src);
      }
    }
  });

  const html = selectDom
    .map((item, dom) => {
      return $(dom).html();
    })
    .get()
    .join('\n');

  const title = $('head title').text() || $('h1:first').text() || fetchUrl;

  return {
    html,
    title,
    usedSelector
  };
};

export type Props = {
  response: any;
  url: string;
  selector?: string;
};
export type Response = {
  title: string;
  content: string;
};
parentPort?.on('message', async (data: Props) => {
  try {
    const $ = cheerio.load(data.response);
    const { title, html } = cheerioToHtml({
      fetchUrl: data.url,
      $: $,
      selector: data.selector
    });

    workerResponse({
      parentPort,
      status: 'success',
      data: {
        title,
        content: html2md(html)
      }
    });
  } catch (error) {
    workerResponse({
      parentPort,
      status: 'error',
      data: error
    });
  }
});
