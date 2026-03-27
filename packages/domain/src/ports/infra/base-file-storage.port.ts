import type { BaseFileCreateType, BaseFileMeta } from '../../value-objects/file.vo';
import type { Result } from '../../value-objects/result.vo';
import { Readable } from 'node:stream';
import type { WriteStream } from 'node:fs';

export interface BaseFileStoragePort<CreateType extends BaseFileCreateType = BaseFileCreateType> {
  /** 存储该文件 */
  save(input: CreateType): Promise<Result<BaseFileMeta>>;
  /** 删除该文件 */
  delete(fileKey: string): Promise<Result<boolean>>;
  /** 获取读取流 */
  getReadStream(fileKey: string): Promise<Result<Readable>>;
  /** 获取写入流 */
  getWriteStream(fileKey: string): Promise<
    Result<{
      stream: WriteStream;
      unlock: () => void;
    }>
  >;

  /** 获取 Buffer*/
  getBuffer(fileKey: string): Promise<Result<Buffer>>;

  /** 读取文件元信息 */
  getInfo(fileKey: string): Promise<Result<BaseFileMeta>>;

  /** 文件是否存在 */
  exists(fileKey: string): Promise<Result<boolean>>;

  /** 移动文件 */
  move(fileKey: string, newFileKey: string): Promise<Result<boolean>>;
}
