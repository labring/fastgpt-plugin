import { isIPv6 } from 'net';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getErrText } from '@tool/utils/err';
import TurndownService from 'turndown';
// @ts-ignore
const turndownPluginGfm = require('joplin-turndown-plugin-gfm');

// Update content size limits
const MAX_CONTENT_SIZE = 20 * 1024 * 1024; // 20MB limit
const MAX_TEXT_LENGTH = 100 * 1000; // 100k characters limit

export const html2md = (html: string) => {
  if (html.length > MAX_TEXT_LENGTH) {
    html = html.slice(0, MAX_TEXT_LENGTH);
  }
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  turndownService.remove(['i', 'script', 'iframe', 'style']);

  turndownService.use(turndownPluginGfm.gfm);

  const md = turndownService.turndown(html);

  const formatMd = md.replace(
    /(!\[([^\]]*)\]|\[([^\]]*)\])(\([^)]*\))/g,
    (match, prefix, imageAlt, linkAlt, url) => {
      const altText = imageAlt !== undefined ? imageAlt : linkAlt;
      const cleanAltText = altText.replace(/\n+/g, ' ').trim();

      return imageAlt !== undefined ? `![${cleanAltText}]${url}` : `[${cleanAltText}]${url}`;
    }
  );

  return formatMd;
};

export const isInternalAddress = (url: string): boolean => {
  const SERVICE_LOCAL_PORT = `${process.env.PORT || 3000}`;
  const SERVICE_LOCAL_HOST =
    process.env.HOSTNAME && isIPv6(process.env.HOSTNAME)
      ? `[${process.env.HOSTNAME}]:${SERVICE_LOCAL_PORT}`
      : `${process.env.HOSTNAME || 'localhost'}:${SERVICE_LOCAL_PORT}`;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const fullUrl = parsedUrl.toString();

    // Check for localhost and common internal domains
    if (hostname === SERVICE_LOCAL_HOST) {
      return true;
    }

    // Metadata endpoints whitelist
    const metadataEndpoints = [
      // AWS
      'http://169.254.169.254/latest/meta-data/',
      // Azure
      'http://169.254.169.254/metadata/instance?api-version=2021-02-01',
      // GCP
      'http://metadata.google.internal/computeMetadata/v1/',
      // Alibaba Cloud
      'http://100.100.100.200/latest/meta-data/',
      // Tencent Cloud
      'http://metadata.tencentyun.com/latest/meta-data/',
      // Huawei Cloud
      'http://169.254.169.254/latest/meta-data/'
    ];
    if (metadataEndpoints.some((endpoint) => fullUrl.startsWith(endpoint))) {
      return true;
    }

    if (process.env.CHECK_INTERNAL_IP !== 'true') return false;

    // For IP addresses, check if they are internal
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Pattern.test(hostname)) {
      return false; // Not an IP address, so it's a domain name - consider it external by default
    }

    // ... existing IP validation code ...
    const parts = hostname.split('.').map(Number);

    if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
      return false;
    }

    // Only allow public IP ranges
    return (
      parts[0] !== 0 &&
      parts[0] !== 10 &&
      parts[0] !== 127 &&
      !(parts[0] === 169 && parts[1] === 254) &&
      !(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) &&
      !(parts[0] === 192 && parts[1] === 168) &&
      !(parts[0] >= 224 && parts[0] <= 239) &&
      !(parts[0] >= 240 && parts[0] <= 255) &&
      !(parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) &&
      !(parts[0] === 9 && parts[1] === 0) &&
      !(parts[0] === 11 && parts[1] === 0)
    );
  } catch {
    return false; // If URL parsing fails, reject it as potentially unsafe
  }
};

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

export const urlsFetch = async ({
  url,
  selector
}: {
  url: string;
  selector?: string;
}): Promise<{
  url: string;
  title: string;
  content: string;
  selector?: string;
}> => {
  const isInternal = isInternalAddress(url);
  if (isInternal) {
    return {
      url,
      title: '',
      content: 'Cannot fetch internal url',
      selector: ''
    };
  }

  try {
    const fetchRes = await axios.get(url, {
      timeout: 30000,
      maxContentLength: MAX_CONTENT_SIZE, // 20MB limit
      maxBodyLength: MAX_CONTENT_SIZE,
      responseType: 'text'
    });

    if (fetchRes.data && fetchRes.data.length > MAX_CONTENT_SIZE) {
      return Promise.reject('Content size exceeds 20MB limit');
    }

    const $ = cheerio.load(fetchRes.data);
    const { title, html, usedSelector } = cheerioToHtml({
      fetchUrl: url,
      $,
      selector
    });

    return {
      url,
      title,
      content: html2md(html),
      selector: usedSelector
    };
  } catch (error) {
    return {
      url,
      title: '',
      content: getErrText(error),
      selector: ''
    };
  }
};

export const InputType = z.object({
  url: z.string()
});

export const OutputType = z.object({
  result: z.string()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { content } = await urlsFetch({
    url: props.url,
    selector: 'body'
  });

  return {
    result: content
  };
}
