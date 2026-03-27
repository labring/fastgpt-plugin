import { env } from '@/env';
import { type BaseFileStoragePort } from '@fastgpt-plugin/domain/ports/infra/base-file-storage.port';
import { detectContentType } from '@fastgpt-plugin/helpers/utils/content-type';
import {
  failureResult,
  successResult,
  type Result
} from '@fastgpt-plugin/domain/value-objects/result.vo';

import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { createReadStream, createWriteStream, WriteStream } from 'node:fs';
import type {
  BaseFileCreateType,
  BaseFileMeta
} from '@fastgpt-plugin/domain/value-objects/file.vo';
import { getNanoid } from '@fastgpt-plugin/helpers/utils/string';
import { getReadStreamFromURL } from '@fastgpt-plugin/helpers/utils/stream';
import { BaseFileStorageRepo, type BaseFileItemType } from './base-file-storage.repo';
import { calculateChecksum, getMetaFromStream, saveFileAndGetMeta } from './utils';

export class LocalFileStorageRepo extends BaseFileStorageRepo implements BaseFileStoragePort {
  private static _instance: LocalFileStorageRepo | null = null;

  private constructor() {
    super({ basePath: env.LOCAL_FILE_BASE_PATH });
  }

  // this method is called in the _getFileItem
  protected override async _loadFile(fileKey: string): Promise<BaseFileItemType | undefined> {
    // read the local file
    const filePath = this._getFilePath(fileKey);

    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      const fileName = filePath.split('/').pop() ?? fileKey;
      const createTime = stats.birthtime;

      const stream = createReadStream(filePath);
      const meta = await getMetaFromStream(stream);
      const fileItem: BaseFileItemType = {
        fileKey,
        fileName,
        createTime,
        lock: false,
        ...meta
      };
      return fileItem;
    } catch {
      // file is not found
      return undefined;
    }
  }

  static getInstance(): LocalFileStorageRepo {
    if (!LocalFileStorageRepo._instance) {
      LocalFileStorageRepo._instance = new LocalFileStorageRepo();
    }
    return LocalFileStorageRepo._instance;
  }

  /** 存储文件到本地 */
  async save(input: BaseFileCreateType): Promise<Result<BaseFileMeta>> {
    const { fileKey, file, overwrite } = input;
    const fileName = input.fileName ?? getNanoid();

    const filePath = this._getFilePath(fileKey);
    const fileItem = await this._getFileItem(fileKey);

    // const contentType= input.contentType ??
    // check exist
    if (fileItem && !overwrite) {
      return failureResult('File already exists');
    }

    if (fileItem && overwrite && fileItem.lock) {
      return failureResult('File is locked');
    }

    try {
      this._lockFile(fileKey);

      const buffer = file.buffer ?? (file.base64 ? Buffer.from(file.base64, 'base64') : undefined);

      if (buffer) {
        await fs.writeFile(filePath, buffer);
        const etag = calculateChecksum(buffer);
        const size = buffer.length;
        const contentType = input.contentType ?? detectContentType(buffer);
        const createTime = new Date();

        this._setFileItem(fileKey, {
          fileName,
          fileKey,
          etag,
          contentType,
          createTime,
          lock: false,
          size
        });

        return successResult({ fileName, fileKey, etag, contentType, createTime, size });
      } else {
        const stream =
          file.stream ??
          (file.path ? createReadStream(file.path) : undefined) ??
          (file.url ? await getReadStreamFromURL(file.url) : undefined);

        const { contentType, etag, size } = await saveFileAndGetMeta(
          createWriteStream(filePath),
          stream!
        );
        return successResult({
          fileKey,
          fileName,
          contentType,
          etag,
          createTime: new Date(),
          size
        });
      }
    } catch (e) {
      return failureResult(`Local File save error`, e);
    } finally {
      this._unlockFile(fileKey);
    }
  }

  async delete(fileKey: string): Promise<Result<boolean>> {
    const fileItem = this._getFileItem(fileKey);
    const filePath = this._getFilePath(fileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }

    return this._withLock(fileKey, async () => {
      await fs.rm(filePath);
      this._removeFileItem(fileKey);
      return successResult(true);
    });
  }

  async getReadStream(fileKey: string): Promise<Result<Readable>> {
    const fileItem = this._getFileItem(fileKey);
    const filePath = this._getFilePath(fileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }

    const stream = createReadStream(filePath);
    return successResult(stream);
  }

  async getWriteStream(fileKey: string): Promise<
    Result<{
      stream: WriteStream;
      unlock: () => void;
    }>
  > {
    const fileItem = this._getFileItem(fileKey);
    const filePath = this._getFilePath(fileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }
    const unlock = await this._lockFile(fileKey);

    const stream = createWriteStream(filePath);
    return successResult({ stream, unlock });
  }

  async getBuffer(fileKey: string): Promise<Result<Buffer>> {
    const fileItem = this._getFileItem(fileKey);
    const filePath = this._getFilePath(fileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }

    const buffer = await fs.readFile(filePath);
    return successResult(buffer);
  }

  async getInfo(fileKey: string): Promise<Result<BaseFileMeta>> {
    const fileItem = await this._getFileItem(fileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }

    return successResult(fileItem);
  }

  async exists(fileKey: string): Promise<Result<boolean>> {
    const fileItem = this._getFileItem(fileKey);
    return successResult(!!fileItem);
  }

  async move(fileKey: string, newFileKey: string): Promise<Result<boolean>> {
    const fileItem = this._getFileItem(fileKey);
    const filePath = this._getFilePath(fileKey);
    const newFilePath = this._getFilePath(newFileKey);

    if (!fileItem) {
      return failureResult('File not found');
    }

    await fs.rename(filePath, newFilePath);
    return successResult(true);
  }
}
