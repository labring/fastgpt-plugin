import path from 'path';

import type { PluginBaseType } from '@domain/entities/plugin.entity';
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
      info: PluginBaseType;
    }>
  > {
    const [stream, err] = await pkgFile.fileStream;

    if (err) {
      return failureResult({ en: 'get file stream error', 'zh-CN': '获取文件流错误' }, err);
    }

    const entries = await unpkg(stream);
    const result: PkgContentFileObjects = {} as any;

    for (const entry of entries) {
      const { filename, directory, stream } = entry;
      if (directory) {
        // we do not need the directory item
        continue;
      }
      const [file, err] = await this.deps.localFileStorageRepo.save({
        file: stream!,
        fileName: filename
      });

      if (err) {
        return failureResult({ en: 'save extracted file error', 'zh-CN': '保存提取文件错误' }, err);
      }

      if (filename === 'index.js') {
        if (FileContentTypeGurad(file, 'application/javascript')) result.index = file;
      } else if (filename === 'manifest.yaml') {
        if (FileContentTypeGurad(file, 'application/json')) result.manifest = file;
      } else if (filename === 'README.md') {
        if (FileContentTypeGurad(file, 'text/markdown')) result.readme = file;
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
          if (!result.assets.length) result.assets = [file];
          else result.assets.push(file);
        }
      } else if (path.basename(filename) === 'logo') {
        // logo
        if (
          FileContentTypeGurad(file, 'image/svg+xml') ||
          FileContentTypeGurad(file, 'image/png') ||
          FileContentTypeGurad(file, 'image/jpeg') ||
          FileContentTypeGurad(file, 'image/gif') ||
          FileContentTypeGurad(file, 'image/webp')
        ) {
          result.logo = file;
        }
      }
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
