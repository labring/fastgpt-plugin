import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { PluginUniqueIdSchema, type PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginUploadUCDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  pluginPKGFileResolver: PluginPKGFilePort;
  pluginRepo: PluginRepoPort;
  logger: UsecaseLogger;
};

type Input = {
  files: {
    file: Readable;
    fileName?: string;
  }[];
};

type UploadFailure = {
  fileName?: string;
  reason: I18nStringType;
};

type Output = {
  plugins: PluginType[];
  failed?: UploadFailure[];
};

const resolveUploadPkgFiles = (
  resolver: PluginPKGFilePort,
  file: FileObject
): Promise<Result<FileObject[]>> => {
  const fileName = file.metaData.fileName.toLowerCase();

  if (fileName.endsWith('.pkg')) {
    return Promise.resolve(successResult([file]));
  }

  if (fileName.endsWith('.zip')) {
    return resolver.parsePluginZipFiles(file);
  }

  return Promise.resolve(
    failureResult({
      en: 'Only .pkg and .zip plugin packages are supported',
      'zh-CN': '仅支持 .pkg 和 .zip 插件包'
    })
  );
};

type ParsedPluginPackage = {
  files: PkgContentFileObjects;
  pkgFile: FileObject;
  plugin: PluginType;
  uniqueId: PluginUniqueIdType;
};

const toPluginKey = (uniqueId: PluginUniqueIdType) =>
  `${uniqueId.pluginId}:${uniqueId.version}:${uniqueId.etag}`;

const rollbackPendingPlugins = async (
  deps: Pick<PluginUploadUCDeps, 'logger' | 'pluginRepo'>,
  uniqueIds: PluginUniqueIdType[],
  existingPendingPluginKeys: Set<string>
) => {
  for (const uniqueId of uniqueIds) {
    if (existingPendingPluginKeys.has(toPluginKey(uniqueId))) {
      continue;
    }

    const [, err] = await deps.pluginRepo.deletePendingPlugin(uniqueId);

    if (err) {
      deps.logger.warn('Failed to rollback pending plugin', {
        uniqueId,
        reason: err.reason
      });
    }
  }
};

const addFailure = (
  failed: UploadFailure[],
  fileName: string | undefined,
  reason: I18nStringType
) => {
  failed.push({
    fileName,
    reason
  });
};

export const makePluginUploadUC =
  (deps: PluginUploadUCDeps) =>
  async (input: Input): Promise<Result<Output>> => {
    const { logger } = deps;
    logger.debug('Plugin Upload', { fileCount: input.files.length });
    logger.info('Upload plugin package files');

    if (input.files.length === 0) {
      return failureResult({
        en: 'file is required',
        'zh-CN': '没有上传文件'
      });
    }

    const uploadedPlugins: PluginType[] = [];
    const failed: UploadFailure[] = [];
    const [existingPendingPlugins, pendingErr] = await deps.pluginRepo.getPendingPluginIds();

    if (pendingErr) {
      logger.error('Plugin Upload Pending List Error', pendingErr);
      return failureResult(
        {
          en: 'Failed to get pending plugin ids',
          'zh-CN': '获取待确认插件列表失败'
        },
        pendingErr
      );
    }

    const existingPendingPluginKeys = new Set(existingPendingPlugins.map(toPluginKey));

    for (const uploadedFile of input.files) {
      const [localPkgFile, err] = await deps.localFileStorageRepo.save({
        file: uploadedFile.file,
        fileKey: randomUUID(),
        fileName: uploadedFile.fileName,
        contentType: 'application/zip',
        overwrite: true
      });

      logger.debug('localPkgFile', { localPkgFile });

      if (err) {
        addFailure(failed, uploadedFile.fileName, err.reason);
        continue;
      }

      const [pkgFiles, extractErr] = await resolveUploadPkgFiles(
        deps.pluginPKGFileResolver,
        localPkgFile
      );

      if (extractErr) {
        void deps.localFileStorageRepo.delete(localPkgFile.metaData.fileKey);

        addFailure(failed, localPkgFile.metaData.fileName, extractErr.reason);
        continue;
      }

      for (const pkgFile of pkgFiles) {
        const [info, parseErr] = await deps.pluginPKGFileResolver.parsePluginPkg(pkgFile, true);
        logger.debug('plugin info', { info });

        if (parseErr) {
          void deps.localFileStorageRepo.delete(pkgFile.metaData.fileKey);

          addFailure(failed, pkgFile.metaData.fileName, parseErr.reason);
          continue;
        }

        const parsedPackage: ParsedPluginPackage = {
          files: info.files,
          pkgFile,
          plugin: info.info,
          uniqueId: PluginUniqueIdSchema.parse(info.info)
        };

        const [, createErr] = await deps.pluginRepo.createPlugin({
          files: parsedPackage.files,
          plugin: parsedPackage.plugin,
          pending: true
        });

        if (createErr) {
          await rollbackPendingPlugins(deps, [parsedPackage.uniqueId], existingPendingPluginKeys);
          addFailure(failed, parsedPackage.pkgFile.metaData.fileName, createErr.reason);
          continue;
        }

        logger.info('Plugin uploaded successfully', {
          pluginId: parsedPackage.plugin.pluginId,
          version: parsedPackage.plugin.version,
          etag: parsedPackage.pkgFile.metaData.etag
        });

        uploadedPlugins.push(parsedPackage.plugin);
      }
    }

    return successResult({
      plugins: uploadedPlugins,
      ...(failed.length ? { failed } : {})
    });
  };
