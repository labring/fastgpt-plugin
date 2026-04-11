import type { Readable } from 'node:stream';

import type { Result } from '../value-objects/result.vo';

export interface URLFileFetcherPort {
  getFileStream(url: string): Promise<Result<Readable>>;
  getFileBuffer(url: string): Promise<Result<Buffer>>;
}
