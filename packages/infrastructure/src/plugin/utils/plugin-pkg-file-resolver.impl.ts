import path from 'path';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import { type PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { FileContentTypeGurad } from '@domain/value-objects/file/file-content-type-gurad';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import type { PluginSourceType } from '@domain/value-objects/plugin.vo';
import { getPluginEtag } from '@domain/value-objects/plugin/plugin-etag.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

import { unpkg } from './pkg';
import { loadPlugin } from './tool-loader';

export type PluginFileResolverDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  pluginRepo: PluginRepoPort;
};

export class PluginPKFFileResolver implements PluginPKGFilePort {
  constructor(private deps: PluginFileResolverDeps) {}

  async parsePluginPkg(
    pkgFile: FileObject,
    source: PluginSourceType,
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

    const entries = await unpkg(stream);
    const result: PkgContentFileObjects = {} as any;
    result.assets = [];
    result.logos = [];

    for (const entry of entries) {
      const { filename, directory, stream } = entry;
      if (directory) {
        // we do not need the directory item
        continue;
      }
      const [file, err] = await this.deps.localFileStorageRepo.save({
        file: stream!,
        fileName: filename,
        overwrite: true
      });

      if (err) {
        return failureResult({ en: 'save extracted file error', 'zh-CN': '保存提取文件错误' }, err);
      }

      if (filename === 'index.js') {
        result.index = file;
      } else if (filename === 'manifest.json') {
        result.manifest = file;
      } else if (filename === 'README.md') {
        result.readme = file;
      } else if (path.dirname(filename) === 'assets') {
        // assets files
        // only images are allowed
        if (
          FileContentTypeGurad(file, 'image/svg+xml') ||
          FileContentTypeGurad(file, 'image/png') ||
          FileContentTypeGurad(file, 'image/jpeg') ||
          FileContentTypeGurad(file, 'image/gif') ||
          FileContentTypeGurad(file, 'image/webp')
        ) {
          result.assets.push(file);
        }
      } else if (
        path.dirname(filename) === '.' &&
        /^([^.]+\.|)logo\./i.test(path.basename(filename))
      ) {
        // logo.* or childId.logo.*
        if (
          FileContentTypeGurad(file, 'image/svg+xml') ||
          FileContentTypeGurad(file, 'image/png') ||
          FileContentTypeGurad(file, 'image/jpeg') ||
          FileContentTypeGurad(file, 'image/gif') ||
          FileContentTypeGurad(file, 'image/webp')
        ) {
          result.logos.push(file);
        }
      }
    }

    if (result.assets.length === 0) {
      delete result.assets;
    }

    if (result.logos.length === 0) {
      delete result.logos;
    }

    if (!result.index) {
      return failureResult({
        en: 'Missing index.js in plugin package',
        'zh-CN': '插件包缺少 index.js'
      });
    }

    if (!result.manifest) {
      return failureResult({
        en: 'Missing manifest.json in plugin package',
        'zh-CN': '插件包缺少 manifest.json'
      });
    }

    const etag = getPluginEtag({
      pkgFile
    }); // read the info from the manifest and logo

    const [manifestBuffer, err2] = await result.manifest.fileBuffer;

    if (err2) {
      return failureResult(
        {
          en: "Can not get manifest.json's buffer",
          'zh-CN': '无法获取manifest.json的缓冲区'
        },
        err2
      );
    }

    const [info, err3] = await loadPlugin({
      etag,
      availableFiles: entries.filter((entry) => !entry.directory).map((entry) => entry.filename),
      getAccessURL: async ({ filePath, pluginId, version }) => {
        const [accessURL, err] = await this.deps.pluginRepo.getPluginFileAccessURL(
          {
            etag,
            pluginId,
            version
          },
          filePath,
          pending
        );
        if (err) return failureResult(err);
        return successResult(accessURL);
      },
      manifest: manifestBuffer.toString(),
      source
    });

    if (err3) {
      return failureResult(
        {
          en: 'Can not load plugin',
          'zh-CN': '无法加载插件'
        },
        err3
      );
    }

    return successResult({
      files: result,
      info
    });
  }
}
