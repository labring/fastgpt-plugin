/**
 * Usecase Description
 * Description：Install the plugin from url
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { randomUUID } from 'node:crypto';

import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { URLFileFetcherPort } from '@domain/ports/url-file-fetcher.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import { PluginUniqueIdSchema } from '@domain/value-objects/plugin.vo';
import { type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
import { batch } from '@shared/utils/fn';

import {
  disableAndUnregisterReplacedPlugins,
  listReplacedActivePlugins
} from './plugin-replace-active';

/** Dependencies */
export type PluginInstallUCDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  urlFileFetcher: URLFileFetcherPort;
  pluginPKGFileResolver: PluginPKGFilePort;
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = { urls: string[]; batchDownloadSize: number };

type DownloadedFile = {
  file: FileObject;
  url: string;
};

const isZipFile = (file: FileObject) => file.metaData.fileName.toLowerCase().endsWith('.zip');

/** Output Type */
type Output = Promise<
  Result<{
    failed?: {
      url: string;
      reason: I18nStringType;
    }[];
  }>
>;

export const makePluginInstallUC =
  ({
    localFileStorageRepo,
    urlFileFetcher,
    pluginPKGFileResolver,
    pluginRepo,
    pluginRuntimeManager,
    logger
  }: PluginInstallUCDeps) =>
  async (input: Input): Output => {
    logger.debug('plugin install', { input });

    const getDownloadedFileName = (url: string) => {
      try {
        const fileName = new URL(url).pathname.split('/').filter(Boolean).pop();
        return fileName;
      } catch {
        return undefined;
      }
    };

    // 1. download the files.
    const results = await batch(
      input.batchDownloadSize,
      input.urls.map((url) => {
        return async () => {
          const [stream, err] = await urlFileFetcher.getFileStream(url);
          if (err)
            return {
              err,
              url
            };
          const [file, err2] = await localFileStorageRepo.save({
            file: stream,
            fileKey: randomUUID(),
            fileName: getDownloadedFileName(url)
          });
          if (err2)
            return {
              err: err2,
              url
            };
          return {
            file,
            url
          };
        };
      })
    );

    const successDownloadedFiles = results.filter((result) => !result.err);
    const failedDownloadFiles = results.filter((result) => result.err);

    const failToInstalled: { fileKey: string; reason: I18nStringType }[] = [];
    const installableFiles: DownloadedFile[] = [];

    for await (const { file, url } of successDownloadedFiles) {
      if (!isZipFile(file)) {
        installableFiles.push({ file, url });
        continue;
      }

      const [pkgFiles, extractErr] = await pluginPKGFileResolver.parsePluginZipFiles(file);

      if (extractErr) {
        failToInstalled.push({
          fileKey: file.metaData.fileKey,
          reason: extractErr.reason
        });
        continue;
      }

      installableFiles.push(...pkgFiles.map((pkgFile) => ({ file: pkgFile, url })));
    }

    for await (const { file } of installableFiles) {
      const [info, parseErr] = await pluginPKGFileResolver.parsePluginPkg(file, false);

      if (parseErr) {
        failToInstalled.push({
          fileKey: file.metaData.fileKey,
          reason: parseErr.reason
        });
        continue;
      }

      const uniqueId = PluginUniqueIdSchema.parse(info.info);
      const [replacedPlugins, replacedErr] = await listReplacedActivePlugins(pluginRepo, uniqueId);

      if (replacedErr) {
        failToInstalled.push({
          fileKey: file.metaData.fileKey,
          reason: replacedErr.reason
        });
        continue;
      }

      const [, createErr] = await pluginRepo.createPlugin({
        files: info.files,
        plugin: info.info,
        pending: false
      });

      if (createErr) {
        failToInstalled.push({
          fileKey: file.metaData.fileKey,
          reason: createErr.reason
        });
        continue;
      }

      if (info.info.type === 'tool') {
        const [, registerErr] = await pluginRuntimeManager.register(uniqueId);

        if (registerErr) {
          failToInstalled.push({
            fileKey: file.metaData.fileKey,
            reason: registerErr.reason
          });
          continue;
        }

        const [, replaceErr] = await disableAndUnregisterReplacedPlugins({
          pluginRepo,
          pluginRuntimeManager,
          replacedPlugins
        });

        if (replaceErr) {
          failToInstalled.push({
            fileKey: file.metaData.fileKey,
            reason: replaceErr.reason
          });
        }
      }
    }

    const failed = [
      ...failedDownloadFiles.map((item) => ({
        url: item.url,
        reason: {
          en: `Download failed`,
          'zh-CN': `下载失败`
        }
      })),
      ...failToInstalled.map((item) => ({
        url:
          installableFiles.find((s) => s.file?.metaData.fileKey === item.fileKey)?.url ??
          successDownloadedFiles.find((s) => s.file?.metaData.fileKey === item.fileKey)?.url ??
          '',
        reason: item.reason
      }))
    ];

    logger.debug('plugin install', {
      failed,
      failToInstalled,
      successDownloadedFiles,
      installableFiles
    });
    if (failed.length) return successResult({ failed }); // partial success

    // fully success
    return successResult({});
  };
