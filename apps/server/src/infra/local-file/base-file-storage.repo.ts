import type { BaseFileMeta } from '@fastgpt-plugin/domain/value-objects/file.vo';
import path from 'node:path';

export type BaseFileItemType = BaseFileMeta & {
  lock: boolean;
};
export class BaseFileStorageRepo<T extends BaseFileItemType = BaseFileItemType> {
  protected _basePath: string;
  protected _files: Map<string, T> = new Map();

  protected constructor(input: { basePath: string }) {
    this._basePath = input.basePath;
  }

  protected _getFilePath(fileKey: string): string {
    return path.join(this._basePath, fileKey);
  }

  /**
   * 子类需要重写这个方法，从数据源同步文件信息，再获取文件项。
   */
  protected async _loadFile(fileKey: string): Promise<T | undefined> {
    throw new Error(`Not implemented: _getFileItem(${fileKey})`);
  }

  protected async _getFileItem(fileKey: string): Promise<T | undefined> {
    const fileItem = this._files.get(fileKey);
    if (fileItem) return fileItem;
    const file = await this._loadFile(fileKey);
    return file;
  }

  protected _setFileItem(fileKey: string, fileItem: T): void {
    this._files.set(fileKey, fileItem);
  }

  protected _removeFileItem(fileKey: string): void {
    this._files.delete(fileKey);
  }

  protected async _lockFile(fileKey: string): Promise<() => void> {
    const fileItem = await this._getFileItem(fileKey);
    if (fileItem) {
      this._setFileItem(fileKey, { ...fileItem, lock: true });
    }
    return () => {
      this._unlockFile(fileKey);
    };
  }

  protected async _unlockFile(fileKey: string): Promise<void> {
    const fileItem = await this._getFileItem(fileKey);
    if (fileItem) {
      this._setFileItem(fileKey, { ...fileItem, lock: false });
    }
  }

  protected async _withLock<T>(fileKey: string, fn: () => Promise<T>): Promise<T> {
    if ((await this._getFileItem(fileKey))?.lock) {
      return Promise.reject(new Error('File is locked'));
    }

    this._lockFile(fileKey);
    try {
      return await fn();
    } finally {
      this._unlockFile(fileKey);
    }
  }
}
