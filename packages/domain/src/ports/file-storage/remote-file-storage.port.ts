import type { Result } from '../../value-objects/result.vo';

import type { BaseFileStoragePort } from './base-file-storage.port';

export interface RemoteFileStoragePort extends BaseFileStoragePort {
  /** 返回可访问链接 */
  getAccessUrl(fileKey: string): Promise<Result<string>>;
  getBucketName(): string;
  /** 获取路径下的所有文件 key */
  getFileKeysByPath(path: string): Promise<Result<string[]>>;
}
