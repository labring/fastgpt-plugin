import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import type { URLFileFetcherPort } from '@domain/ports/url-file-fetcher.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { isInternalAddress } from './secure/ssrf';

export class URLFileFetcher implements URLFileFetcherPort {
  async getFileStream(url: string): Promise<Result<Readable>> {
    if (isInternalAddress(url))
      return failureResult({
        en: 'SSRF: Internal address is not allowed',
        'zh-CN': 'SSRF: 不允许内部地址'
      });
    const response = await fetch(url);
    if (!response.ok)
      return failureResult({
        en: 'Failed to fetch file stream',
        'zh-CN': '未能获取文件流'
      });
    return successResult(Readable.fromWeb(response.body as ReadableStream));
  }

  async getFileBuffer(url: string): Promise<Result<Buffer>> {
    if (isInternalAddress(url))
      return failureResult({
        en: 'SSRF: Internal address is not allowed',
        'zh-CN': 'SSRF: 不允许内部地址'
      });
    const response = await fetch(url);

    if (!response.ok)
      return failureResult({
        en: 'Failed to fetch file buffer',
        'zh-CN': '未能获取文件缓冲区'
      });

    return successResult(Buffer.from(await response.arrayBuffer()));
  }
}
