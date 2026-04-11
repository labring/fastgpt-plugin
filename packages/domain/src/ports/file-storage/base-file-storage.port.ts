import { Readable } from 'node:stream';

import type { FileCreateType, FileMetaType } from '../../value-objects/file/file.vo';
import type { FileObject } from '../../value-objects/file/file-object.vo';
import type { Result } from '../../value-objects/result.vo';

export interface BaseFileStoragePort {
  /** 存储该文件 */
  save(input: FileCreateType): Promise<Result<FileObject>>;
  /** 删除该文件 */
  delete(fileKey: string): Promise<Result<boolean>>;
  /** 删除路径下的所有文件 */
  deletePath(path: string): Promise<Result<boolean>>;
  /** 获取读取流 */
  getReadStream(fileKey: string): Promise<Result<Readable>>;

  /** 获取 Buffer*/
  getBuffer(fileKey: string): Promise<Result<Buffer>>;

  /** 读取文件元信息 */
  getInfo(fileKey: string): Promise<Result<FileMetaType>>;

  /** 文件是否存在 */
  exists(fileKey: string): Promise<Result<boolean>>;

  /** 移动文件 */
  move(fileKey: string, newFileKey: string): Promise<Result<boolean>>;

  /** 拼接路径 */
  joinPath(...paths: string[]): string;

  /** 获取文件对象 */
  getFileObject(fileKey: string): Promise<Result<FileObject>>;
}
