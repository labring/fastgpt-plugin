import type { RemoteFileCreateType } from '../../value-objects/file.vo';
import type { Result } from '../../value-objects/result.vo';
import type { BaseFileStoragePort } from './base-file-storage.port';

export interface RemoteFileStoragePort extends BaseFileStoragePort<RemoteFileCreateType> {
  /** 返回可访问链接 */
  getAccessUrl(fileKey: string): Promise<Result<string>>;
  /** 设置过期时间 */
  setExpire(fileKey: string, expireAt: Date): Promise<Result<boolean>>;
  /** 移除过期时间 */
  removeExpire(fileKey: string): Promise<void>;
}
