import type { WriteStream } from 'node:fs';

import type { Result } from '../../value-objects/result.vo';

import type { BaseFileStoragePort } from './base-file-storage.port';

export interface LocalFileStoragePort extends BaseFileStoragePort {
  /** 获取写入流 */
  getWriteStream(fileKey: string): Promise<
    Result<{
      stream: WriteStream;
      unlock: () => void;
    }>
  >;
  /** 获取路径下的所有文件 */
  getFileKeysByPath(path: string): Promise<Result<string[]>>;
}
