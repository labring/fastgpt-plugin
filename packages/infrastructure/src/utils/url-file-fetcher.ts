import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import type { URLFileFetcherPort } from '@domain/ports/url-file-fetcher.port';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { type UrlSafetyError, validateExternalFetchUrl } from './secure/ssrf';

const MAX_REDIRECTS = 5;

const URL_SAFETY_ERROR_MESSAGES: Record<UrlSafetyError | 'too-many-redirects', I18nStringType> = {
  'invalid-url': {
    en: 'Invalid URL',
    'zh-CN': 'URL 无效'
  },
  'unsupported-protocol': {
    en: 'Only HTTPS URLs are allowed',
    'zh-CN': '仅允许 HTTPS URL'
  },
  'host-not-allowed': {
    en: 'Install host is not allowed',
    'zh-CN': '不允许从该主机安装'
  },
  'internal-address': {
    en: 'SSRF: Internal address is not allowed',
    'zh-CN': 'SSRF: 不允许内部地址'
  },
  'dns-lookup-failed': {
    en: 'Failed to verify URL host',
    'zh-CN': '未能验证 URL 主机'
  },
  'too-many-redirects': {
    en: 'Too many redirects while fetching URL',
    'zh-CN': '获取 URL 时重定向次数过多'
  }
};

const isRedirect = (status: number): boolean => status >= 300 && status < 400;

export class URLFileFetcher implements URLFileFetcherPort {
  private async fetchWithProtection(url: string): Promise<Result<Response>> {
    let currentUrl = url;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const validation = await validateExternalFetchUrl(currentUrl);
      if (!validation.ok) {
        return failureResult(URL_SAFETY_ERROR_MESSAGES[validation.error]);
      }

      const response = await fetch(validation.url, { redirect: 'manual' });
      if (!isRedirect(response.status)) {
        return successResult(response);
      }

      const location = response.headers.get('location');
      if (!location) {
        return failureResult({
          en: 'Redirect response is missing location header',
          'zh-CN': '重定向响应缺少 location 头'
        });
      }

      currentUrl = new URL(location, validation.url).toString();
    }

    return failureResult(URL_SAFETY_ERROR_MESSAGES['too-many-redirects']);
  }

  async getFileStream(url: string): Promise<Result<Readable>> {
    const [response, fetchErr] = await this.fetchWithProtection(url);
    if (fetchErr || !response) {
      return failureResult(fetchErr?.reason ?? URL_SAFETY_ERROR_MESSAGES['invalid-url']);
    }

    if (!response.ok)
      return failureResult({
        en: 'Failed to fetch file stream',
        'zh-CN': '未能获取文件流'
      });
    if (!response.body)
      return failureResult({
        en: 'Empty file stream',
        'zh-CN': '文件流为空'
      });
    return successResult(Readable.fromWeb(response.body as ReadableStream));
  }

  async getFileBuffer(url: string): Promise<Result<Buffer>> {
    const [response, fetchErr] = await this.fetchWithProtection(url);
    if (fetchErr || !response) {
      return failureResult(fetchErr?.reason ?? URL_SAFETY_ERROR_MESSAGES['invalid-url']);
    }

    if (!response.ok)
      return failureResult({
        en: 'Failed to fetch file buffer',
        'zh-CN': '未能获取文件缓冲区'
      });

    return successResult(Buffer.from(await response.arrayBuffer()));
  }
}
