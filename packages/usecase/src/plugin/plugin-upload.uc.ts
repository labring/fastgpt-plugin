import type { Readable } from 'node:stream';

import type { PluginBaseType } from '@domain/entities/plugin.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';

export type PluginUploadUCDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  pluginPKGFileResolver: PluginPKGFilePort;
  pluginRepo: PluginRepoPort;
};

type Input = {
  file: Readable;
};

export const makePluginUploadUC =
  (deps: PluginUploadUCDeps) =>
  async (input: Input): Promise<Result<PluginBaseType>> => {
    // 1. recieve the file and save it to local storage
    const [localPkgFile, err] = await deps.localFileStorageRepo.save({
      file: input.file,
      contentType: 'application/zip'
    });

    if (err)
      return failureResult(
        {
          en: 'Failed to Upload',
          'zh-CN': '上传失败'
        },
        err
      );

    // 2. upload
    // 2.1. 解析插件信息
    const [info, parseErr] = await deps.pluginPKGFileResolver.parsePluginPkg(
      localPkgFile,
      'system', // 目前指定为 system, 后续开放用户上传，这里需要通过参数传入
      true
    );

    if (parseErr) {
      return failureResult(
        {
          en: 'Failed to parse the plugin package',
          'zh-CN': '解析插件包失败'
        },
        err
      );
    }

    // 2.2 保存为 pending 状态
    const [, createErr] = await deps.pluginRepo.createPlugin({
      files: info.files,
      plugin: info.info,
      pending: true
    });

    if (createErr) {
      return failureResult(
        {
          en: 'Failed to create the plugin',
          'zh-CN': '创建插件失败'
        },
        createErr
      );
    }

    return successResult(info.info);
  };
