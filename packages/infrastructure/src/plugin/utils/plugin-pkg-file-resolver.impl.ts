import { randomUUID } from 'node:crypto';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import { type PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { detectMimeTypeFromContent } from '@domain/value-objects/file/MIME.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { bufferToReadable, readStreamToBuffer, unpkg } from './pkg';
import { type ParsedPkgFile, parsePkg } from './pkg-parser';

export type PluginFileResolverDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  pluginRepo: PluginRepoPort;
};

export class PluginPKFFileResolver implements PluginPKGFilePort {
  constructor(private deps: PluginFileResolverDeps) {}

  private async saveParsedFile(file: ParsedPkgFile): Promise<Result<FileObject>> {
    return this.deps.localFileStorageRepo.save({
      file: file.stream,
      fileKey: randomUUID(),
      fileName: file.filename,
      overwrite: true
    });
  }

  async parsePluginZipFiles(zipFile: FileObject): Promise<Result<FileObject[]>> {
    const [buffer, bufferErr] = await zipFile.fileBuffer;

    if (bufferErr) {
      return failureResult(
        {
          en: 'Failed to read uploaded zip package',
          'zh-CN': '读取上传的 zip 包失败'
        },
        bufferErr
      );
    }

    let entries: Awaited<ReturnType<typeof unpkg>>;

    try {
      entries = await unpkg(bufferToReadable(buffer));
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to parse zip package',
          'zh-CN': '解析 zip 包失败'
        },
        error
      );
    }

    const files = entries.filter((entry) => !entry.directory);
    const invalidFile = files.find((entry) => !entry.filename.toLowerCase().endsWith('.pkg'));

    if (files.length === 0 || invalidFile) {
      return failureResult({
        en: 'Zip package must contain only .pkg files',
        'zh-CN': 'zip 包内只能包含 .pkg 文件'
      });
    }

    const pkgFiles: FileObject[] = [];

    for (const entry of files) {
      if (!entry.stream) {
        return failureResult({
          en: `Missing file stream in zip package: ${entry.filename}`,
          'zh-CN': `zip 包内文件流缺失: ${entry.filename}`
        });
      }

      const [entryBuffer, entryErr] = await readStreamToBuffer(entry.stream);
      if (entryErr) {
        return failureResult(
          {
            en: `Failed to read pkg file in zip package: ${entry.filename}`,
            'zh-CN': `读取 zip 包内 pkg 文件失败: ${entry.filename}`
          },
          entryErr
        );
      }

      if (detectMimeTypeFromContent(entryBuffer) !== 'application/zip') {
        return failureResult({
          en: `Invalid pkg file in zip package: ${entry.filename}`,
          'zh-CN': `zip 包内 pkg 文件无效: ${entry.filename}`
        });
      }

      const [savedPkgFile, saveErr] = await this.deps.localFileStorageRepo.save({
        file: entryBuffer,
        fileKey: randomUUID(),
        fileName: entry.filename,
        contentType: 'application/zip',
        overwrite: true
      });

      if (saveErr) {
        return failureResult(
          {
            en: `Failed to save pkg file in zip package: ${entry.filename}`,
            'zh-CN': `保存 zip 包内 pkg 文件失败: ${entry.filename}`
          },
          saveErr
        );
      }

      pkgFiles.push(savedPkgFile);
    }

    return successResult(pkgFiles);
  }

  async parsePluginPkg(
    pkgFile: FileObject,
    pending: boolean
  ): Promise<
    Result<{
      files: PkgContentFileObjects;
      info: PluginType;
    }>
  > {
    const [stream, err] = await pkgFile.fileStream;

    if (err) {
      return failureResult({ en: 'get file stream error', 'zh-CN': '获取文件流错误' }, err);
    }

    const [parsed, parseErr] = await parsePkg({
      input: stream,
      getAccessURL: async ({ filePath, pluginId, version, etag }) => {
        return this.deps.pluginRepo.getPluginFileAccessURL(
          {
            etag,
            pluginId,
            version
          },
          filePath,
          pending
        );
      }
    });

    if (parseErr) {
      return failureResult(
        {
          en: 'Can not load plugin',
          'zh-CN': '无法加载插件'
        },
        parseErr
      );
    }

    const [index, indexErr] = await this.saveParsedFile(parsed.files.index);
    if (indexErr) {
      return failureResult(
        { en: 'save extracted file error', 'zh-CN': '保存提取文件错误' },
        indexErr
      );
    }

    const [manifest, manifestErr] = await this.saveParsedFile(parsed.files.manifest);
    if (manifestErr) {
      return failureResult(
        { en: 'save extracted file error', 'zh-CN': '保存提取文件错误' },
        manifestErr
      );
    }

    const result: PkgContentFileObjects = {
      index,
      manifest
    };

    if (parsed.files.readme) {
      const [readme, readmeErr] = await this.saveParsedFile(parsed.files.readme);
      if (readmeErr) {
        return failureResult(
          { en: 'save extracted file error', 'zh-CN': '保存提取文件错误' },
          readmeErr
        );
      }
      result.readme = readme;
    }

    if (parsed.files.assets?.length) {
      const assets: FileObject[] = [];
      for (const asset of parsed.files.assets) {
        const [savedAsset, assetErr] = await this.saveParsedFile(asset);
        if (assetErr) {
          return failureResult(
            { en: 'save extracted file error', 'zh-CN': '保存提取文件错误' },
            assetErr
          );
        }
        assets.push(savedAsset);
      }
      result.assets = assets;
    }

    if (parsed.files.logos?.length) {
      const logos: FileObject[] = [];
      for (const logo of parsed.files.logos) {
        const [savedLogo, logoErr] = await this.saveParsedFile(logo);
        if (logoErr) {
          return failureResult(
            { en: 'save extracted file error', 'zh-CN': '保存提取文件错误' },
            logoErr
          );
        }
        logos.push(savedLogo);
      }
      result.logos = logos;
    }

    return successResult({
      files: result,
      info: parsed.info
    });
  }
}
