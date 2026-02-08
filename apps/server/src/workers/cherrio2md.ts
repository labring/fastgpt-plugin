import * as cheerio from 'cheerio';
// import type { Cherrio2mdProps, Cherrio2mdResponse } from '@/lib/worker/type';
import { getErrText } from '@/utils/err';
import { html2md } from '@/lib/worker/html2md';
import type { Cherrio2MdInput, Cherrio2MdResult } from '@fastgpt-plugin/helpers/index';
import { isInternalAddress } from '@/utils/secure';
import { serviceRequestMaxContentLength } from '@/modules/tool/constants/server';
import { Cherrio2MdInputSchema } from '@fastgpt-plugin/helpers/events/schemas';

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

export default async (input: Cherrio2MdInput): Promise<Cherrio2MdResult> => {
  const { fetchUrl, selector } = Cherrio2MdInputSchema.parse(input);

  if (isInternalAddress(fetchUrl)) {
    throw new Error('Internal address not allowed');
  }

  const response = await fetch(fetchUrl);
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > serviceRequestMaxContentLength) {
    throw new Error('Content length exceeds limit');
  }

  try {
    const text = await response.text();
    const $ = cheerio.load(text);
    const { title, html } = cheerioToHtml({
      fetchUrl,
      $: $,
      selector
    });
    return {
      title,
      markdown: html2md(html)
    };
  } catch (e) {
    throw new Error('Cheerio2md error:' + getErrText(e));
  }
};
