/**
 * Usecase Description
 * Description：Install the plugin from url
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { URLFileFetcherPort } from '@domain/ports/url-file-fetcher.port';
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
            file: stream
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

    for await (const { file } of successDownloadedFiles) {
      const [info, parseErr] = await pluginPKGFileResolver.parsePluginPkg(file, false);

      if (parseErr) {
        failToInstalled.push({
          fileKey: file.metaData.fileKey,
          reason: parseErr.reason
        });
        continue;
      }

      const uniqueId = PluginUniqueIdSchema.parse(info.info);
      const [replacedPlugins, replacedErr] = await listReplacedActivePlugins(
        pluginRepo,
        uniqueId
      );

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
      ...(failToInstalled.map((item) => ({
        url:
          successDownloadedFiles.find((s) => s.file?.metaData.fileKey === item.fileKey)?.url ??
          '',
        reason: item.reason
      })) ?? [])
    ];

    logger.debug('plugin install', { failed, failToInstalled, successDownloadedFiles });
    if (failed.length) return successResult({ failed }); // partial success

    // fully success
    return successResult({});
  };
