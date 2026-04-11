import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, type WriteStream } from 'node:fs';
import {
  access,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import {
  type FileCreateType,
  FileMetaSchema,
  type FileMetaType
} from '@domain/value-objects/file/file.vo';
import { FileObject } from '@domain/value-objects/file/file-object.vo';
import {
  detectMimeTypeFromContent,
  getMimeTypeFromFilename,
  type MIMEType
} from '@domain/value-objects/file/MIME.vo';
import type { Result } from '@domain/value-objects/result.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

import { env } from '../env';

import { calculateMD5, saveFileAndGetMeta } from './utils';

type PersistedMeta = {
  fileName: string;
  contentType: MIMEType;
  etag: string;
  createTime: string;
};

type LegacyStreamInput = {
  stream: Readable;
};

export class LocalFileStorageRepo implements LocalFileStoragePort {
  private static _instance: LocalFileStorageRepo;

  private readonly basePath = env.LOCAL_FILE_BASE_PATH;

  private constructor() {}

  static getInstance(): LocalFileStorageRepo {
    if (!this._instance) {
      this._instance = new LocalFileStorageRepo();
    }
    return this._instance;
  }

  async getWriteStream(
    fileKey: string
  ): Promise<Result<{ stream: WriteStream; unlock: () => void }>> {
    const absolutePath = this.resolveStoragePath(fileKey);
    const lockPath = this.getLockPath(absolutePath);

    try {
      await mkdir(path.dirname(absolutePath), { recursive: true });
      const lockHandle = await open(lockPath, 'wx');

      let released = false;
      const release = () => {
        if (released) return;
        released = true;

        void lockHandle.close().catch(() => {});
        void rm(lockPath, { force: true }).catch(() => {});
      };

      const stream = createWriteStream(absolutePath);
      stream.once('close', release);
      stream.once('error', release);

      return successResult({
        stream,
        unlock: release
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to create local file write stream',
          'zh-CN': '创建本地文件写入流失败'
        },
        error
      );
    }
  }

  async getFileKeysByPath(targetPath: string): Promise<Result<string[]>> {
    const absolutePath = this.resolveStoragePath(targetPath);

    try {
      const exists = await this.pathExists(absolutePath);
      if (!exists) {
        return successResult([]);
      }

      const stats = await stat(absolutePath);
      if (stats.isFile()) {
        return successResult([this.normalizeFileKey(absolutePath)]);
      }

      const fileKeys: string[] = [];
      await this.collectFileKeys(absolutePath, fileKeys);

      return successResult(fileKeys);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get local file keys',
          'zh-CN': '获取本地文件列表失败'
        },
        error
      );
    }
  }

  async save(input: FileCreateType): Promise<Result<FileObject>> {
    const relativeFileKey = this.buildFileKey(input);
    const absolutePath = this.resolveStoragePath(relativeFileKey);
    const fileName = input.fileName ?? path.basename(relativeFileKey);
    const createTime = new Date();

    try {
      if (!input.overwrite && (await this.pathExists(absolutePath))) {
        return failureResult({
          en: 'File already exists',
          'zh-CN': '文件已存在'
        });
      }

      await mkdir(path.dirname(absolutePath), { recursive: true });

      const file = this.normalizeFileInput(input.file);

      let metaData: FileMetaType;
      if (Buffer.isBuffer(file)) {
        await writeFile(absolutePath, file);

        metaData = FileMetaSchema.parse({
          fileKey: relativeFileKey,
          fileName,
          contentType: this.resolveContentType({
            provided: input.contentType,
            detected: detectMimeTypeFromContent(file),
            fileName
          }),
          size: file.length,
          etag: calculateMD5(file),
          createTime
        });
      } else {
        const [writeTarget, writeErr] = await this.getWriteStream(relativeFileKey);
        if (writeErr) {
          return failureResult(writeErr);
        }

        try {
          const trackedMeta = await saveFileAndGetMeta(writeTarget.stream, file);

          metaData = FileMetaSchema.parse({
            fileKey: relativeFileKey,
            fileName,
            contentType: this.resolveContentType({
              provided: input.contentType,
              detected: trackedMeta.contentType,
              fileName
            }),
            size: trackedMeta.size,
            etag: trackedMeta.etag,
            createTime
          });
        } finally {
          writeTarget.unlock();
        }
      }

      await this.writeMeta(absolutePath, metaData);

      return successResult(
        new FileObject({
          metaData,
          getBuffer: () => this.getBuffer(metaData.fileKey),
          getReadStream: () => this.getReadStream(metaData.fileKey)
        })
      );
    } catch (error) {
      await this.cleanupFileArtifacts(absolutePath);

      return failureResult(
        {
          en: 'Local file save error',
          'zh-CN': '本地文件保存错误'
        },
        error
      );
    }
  }

  async delete(fileKey: string): Promise<Result<boolean>> {
    const absolutePath = this.resolveStoragePath(fileKey);

    try {
      await this.cleanupFileArtifacts(absolutePath);
      return successResult(true);
    } catch (error) {
      return failureResult(
        {
          en: 'Local file delete error',
          'zh-CN': '本地文件删除错误'
        },
        error
      );
    }
  }

  async deletePath(targetPath: string): Promise<Result<boolean>> {
    if (!targetPath.trim()) {
      return failureResult({
        en: 'Path is required',
        'zh-CN': '路径不能为空'
      });
    }

    try {
      await rm(this.resolveStoragePath(targetPath), {
        recursive: true,
        force: true
      });
      return successResult(true);
    } catch (error) {
      return failureResult(
        {
          en: 'Local file delete error',
          'zh-CN': '本地文件删除错误'
        },
        error
      );
    }
  }

  async getReadStream(fileKey: string): Promise<Result<Readable>> {
    const absolutePath = this.resolveStoragePath(fileKey);

    try {
      if (!(await this.pathExists(absolutePath))) {
        return failureResult({
          en: 'File not found',
          'zh-CN': '文件不存在'
        });
      }

      return successResult(createReadStream(absolutePath));
    } catch (error) {
      return failureResult(
        {
          en: 'Local file read error',
          'zh-CN': '本地文件读取错误'
        },
        error
      );
    }
  }

  async getBuffer(fileKey: string): Promise<Result<Buffer>> {
    const absolutePath = this.resolveStoragePath(fileKey);

    try {
      return successResult(await readFile(absolutePath));
    } catch (error) {
      return failureResult(
        {
          en: 'Local file buffer read error',
          'zh-CN': '本地文件缓冲读取错误'
        },
        error
      );
    }
  }

  async getInfo(fileKey: string): Promise<Result<FileMetaType>> {
    const absolutePath = this.resolveStoragePath(fileKey);

    try {
      const stats = await stat(absolutePath);
      const persistedMeta = await this.readPersistedMeta(absolutePath);
      const normalizedFileKey = this.normalizeFileKey(fileKey);
      const buffer = persistedMeta ? null : await readFile(absolutePath);
      const fallbackContentType = buffer
        ? detectMimeTypeFromContent(
            buffer,
            getMimeTypeFromFilename(path.basename(normalizedFileKey)) ?? 'application/octet-stream'
          )
        : undefined;

      const metaData = FileMetaSchema.parse({
        fileKey: normalizedFileKey,
        fileName: persistedMeta?.fileName ?? path.basename(normalizedFileKey),
        contentType:
          persistedMeta?.contentType ?? fallbackContentType ?? 'application/octet-stream',
        size: stats.size,
        etag: persistedMeta?.etag ?? calculateMD5(buffer ?? Buffer.alloc(0)),
        createTime: persistedMeta?.createTime ? new Date(persistedMeta.createTime) : stats.birthtime
      });

      return successResult(metaData);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get local file info',
          'zh-CN': '获取本地文件信息失败'
        },
        error
      );
    }
  }

  async exists(fileKey: string): Promise<Result<boolean>> {
    return successResult(await this.pathExists(this.resolveStoragePath(fileKey)));
  }

  async move(fileKey: string, newFileKey: string): Promise<Result<boolean>> {
    const sourcePath = this.resolveStoragePath(fileKey);
    const targetPath = this.resolveStoragePath(newFileKey);

    try {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await rename(sourcePath, targetPath);

      const sourceMetaPath = this.getMetaPath(sourcePath);
      if (await this.pathExists(sourceMetaPath)) {
        await rename(sourceMetaPath, this.getMetaPath(targetPath));
      }

      return successResult(true);
    } catch (error) {
      return failureResult(
        {
          en: 'Local file move error',
          'zh-CN': '本地文件移动错误'
        },
        error
      );
    }
  }

  joinPath(...paths: string[]): string {
    return path.join(this.basePath, ...paths);
  }

  async getFileObject(fileKey: string): Promise<Result<FileObject>> {
    const [metaData, err] = await this.getInfo(fileKey);
    if (err) {
      return failureResult(err);
    }

    return successResult(
      new FileObject({
        metaData,
        getBuffer: () => this.getBuffer(metaData.fileKey),
        getReadStream: () => this.getReadStream(metaData.fileKey)
      })
    );
  }

  private buildFileKey(input: Pick<FileCreateType, 'fileKey' | 'path' | 'fileName'>): string {
    if (input.fileKey) {
      return this.normalizeFileKey(input.fileKey);
    }

    const fileName = input.fileName ?? randomUUID();
    const targetPath = input.path ? this.normalizeFileKey(input.path) : '';

    return this.normalizeFileKey(path.join(targetPath, fileName));
  }

  private normalizeFileInput(file: FileCreateType['file']): Buffer | Readable {
    if (Buffer.isBuffer(file)) {
      return file;
    }

    if (file instanceof Uint8Array) {
      return Buffer.from(file);
    }

    if (file instanceof Readable) {
      return file;
    }

    const legacyFile = file as LegacyStreamInput;
    if (legacyFile?.stream instanceof Readable) {
      return legacyFile.stream;
    }

    throw new Error('Unsupported local file input');
  }

  private normalizeFileKey(fileKey: string): string {
    const absolutePath = this.resolveStoragePath(fileKey);
    const relativePath = path.relative(this.basePath, absolutePath);

    return this.toPosixPath(relativePath);
  }

  private resolveStoragePath(fileKey: string): string {
    const absolutePath = path.isAbsolute(fileKey)
      ? path.resolve(fileKey)
      : path.resolve(this.basePath, fileKey);

    const relativePath = path.relative(this.basePath, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Local file path must stay within the configured base path');
    }

    return absolutePath;
  }

  private resolveContentType({
    provided,
    detected,
    fileName
  }: {
    provided?: MIMEType;
    detected: MIMEType;
    fileName: string;
  }): MIMEType {
    if (provided) {
      return provided;
    }

    if (detected !== 'application/octet-stream') {
      return detected;
    }

    return getMimeTypeFromFilename(fileName) ?? detected;
  }

  private async pathExists(targetPath: string) {
    try {
      await access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private getMetaPath(targetPath: string): string {
    return `${targetPath}.meta.json`;
  }

  private getLockPath(targetPath: string): string {
    return `${targetPath}.lock`;
  }

  private async writeMeta(targetPath: string, metaData: FileMetaType) {
    const persistedMeta: PersistedMeta = {
      fileName: metaData.fileName,
      contentType: metaData.contentType,
      etag: metaData.etag,
      createTime: metaData.createTime.toISOString()
    };

    await writeFile(this.getMetaPath(targetPath), JSON.stringify(persistedMeta, null, 2), 'utf8');
  }

  private async readPersistedMeta(targetPath: string): Promise<PersistedMeta | null> {
    try {
      const content = await readFile(this.getMetaPath(targetPath), 'utf8');
      return JSON.parse(content) as PersistedMeta;
    } catch {
      return null;
    }
  }

  private async cleanupFileArtifacts(targetPath: string) {
    await Promise.all([
      rm(targetPath, { force: true }),
      rm(this.getMetaPath(targetPath), { force: true }),
      rm(this.getLockPath(targetPath), { force: true })
    ]);
  }

  private async collectFileKeys(targetPath: string, fileKeys: string[]) {
    const entries = await readdir(targetPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        await this.collectFileKeys(entryPath, fileKeys);
        continue;
      }

      if (entry.name.endsWith('.meta.json') || entry.name.endsWith('.lock')) {
        continue;
      }

      fileKeys.push(this.normalizeFileKey(entryPath));
    }
  }

  private toPosixPath(targetPath: string): string {
    return targetPath.split(path.sep).join('/');
  }
}
