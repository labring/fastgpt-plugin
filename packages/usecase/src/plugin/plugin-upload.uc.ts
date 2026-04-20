import type { Readable } from 'node:stream';

import {} from 'packages/infrastructure/src/env';

import type { PluginType } from '@domain/entities/plugin.entity';
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
  async (input: Input): Promise<Result<PluginType>> => {
    // 1. recieve the file and save it to local storage
    const [localPkgFile, err] = await deps.localFileStorageRepo.save({
      file: input.file,
      contentType: 'application/zip',
      overwrite: true
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
    const [info, parseErr] = await deps.pluginPKGFileResolver.parsePluginPkg(localPkgFile, true);

    if (parseErr) {
      deps.localFileStorageRepo.delete(localPkgFile.metaData.fileKey); // 删除临时文件
      return failureResult(
        {
          en: 'Failed to parse the plugin package',
          'zh-CN': '解析插件包失败'
        },
        parseErr
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
