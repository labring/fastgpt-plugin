import * as cheerio from 'cheerio';
import type { Cherrio2mdProps, Cherrio2mdResponse } from '@/lib/worker/type';
import { getErrText } from '@/utils/err';
import { html2md } from '@/lib/worker/html2md';

const cheerioToHtml = ({
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

export default (data: Cherrio2mdProps): Cherrio2mdResponse => {
  try {
    const $ = cheerio.load(data.response);
    const { title, html } = cheerioToHtml({
      fetchUrl: data.url,
      $: $,
      selector: data.selector
    });

    return {
      title,
      content: html2md(html)
    };
  } catch (e) {
    throw new Error('Cheerio2md error:' + getErrText(e));
  }
};
