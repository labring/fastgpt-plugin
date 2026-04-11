import path from 'node:path';

import { addMinutes } from 'date-fns';

import {
  PluginSchema,
  type PluginTagType,
  type PluginType,
  type PluginTypeType
} from '@domain/entities/plugin.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import type { FileTTLPort } from '@domain/ports/file-ttl.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import {
  type PluginTagListType,
  PluginUniqueIdSchema,
  type PluginUniqueIdType
} from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { PluginTagsNameMap } from '@infrastructure/static-data/plugin-tag';

import { MongoClient } from '../storage/mongo';
import { isDuplicateKeyError } from '../storage/mongo/utils';

export type PluginRepoDeps = {
  mongoClient: MongoClient;
  localFileStorageRepo: LocalFileStoragePort;
  privateRemoteFileStorageRepo: RemoteFileStoragePort;
  publicRemoteFileStorageRepo: RemoteFileStoragePort;
  fileTTLManager: FileTTLPort;
};

export class PluginRepo implements PluginRepoPort {
  private static _instance: PluginRepo;
  private static ExpiresMinutes: number = 120;

  private getFileKey(id: PluginUniqueIdType, filePath: string[], pending: boolean): string {
    const array = pending
      ? ['temp', id.pluginId, id.version, id.etag, ...filePath]
      : [id.pluginId, id.version, id.etag, ...filePath];
    return path.join(...array);
  }

  constructor(private readonly deps: PluginRepoDeps) {}

  async getPluginsByPluginId(pluginId: string): Promise<Result<PluginType[]>> {
    const plugins = await this.deps.mongoClient.getModel('plugin').find({ pluginId }).lean();
    return successResult(plugins.map((plugin) => PluginSchema.parse(plugin)));
  }

  public static getInstance(deps: PluginRepoDeps): PluginRepo {
    if (!PluginRepo._instance) {
      PluginRepo._instance = new PluginRepo(deps);
    }
    return PluginRepo._instance;
  }

  async confirmPlugin(pluginId: PluginUniqueIdType): Promise<Result<PluginType>> {
    try {
      const plugin = await this.deps.mongoClient
        .getModel('plugin')
        .findOneAndUpdate(
          {
            ...pluginId
          },
          {
            $unset: {
              pending: 1,
              expiredAt: 1
            }
          }
        )
        .lean();

      // get s3 files
      const [publicFiles, err] = await this.deps.publicRemoteFileStorageRepo.getFileKeysByPath(
        this.getFileKey(pluginId, [], true)
      );
      const [privateFiles, privateErr] =
        await this.deps.privateRemoteFileStorageRepo.getFileKeysByPath(
          this.getFileKey(pluginId, [], false)
        );

      if (err || privateErr) {
        return failureResult(
          { en: 'Failed to get s3 files', 'zh-CN': '获取s3文件失败' },
          err || privateErr
        );
      }

      const fileMoveResults = await Promise.all([
        ...publicFiles.map(async (fileKey) => {
          return await this.deps.publicRemoteFileStorageRepo.move(
            fileKey,
            fileKey.replace('temp/', '')
          );
        }),
        ...privateFiles.map(async (fileKey) => {
          return await this.deps.privateRemoteFileStorageRepo.move(
            fileKey,
            fileKey.replace('temp/', '')
          );
        })
      ]);

      if (fileMoveResults.some((result) => result[1])) {
        return failureResult({
          en:
            'Failed to move files: ' + fileMoveResults.filter((result) => result[1])[0][1]?.reason,
          'zh-CN': '移动文件失败' + fileMoveResults.filter((result) => result[1])[0][1]?.reason
        });
      }

      return successResult(PluginSchema.parse(plugin));
    } catch (error) {
      return failureResult({ en: 'Failed to confirm plugin', 'zh-CN': '确认插件失败' }, error);
    }
  }

  async list({
    op,
    types,
    tags
  }: {
    types?: PluginTypeType[];
    tags?: PluginTagType[];
    op?: 'or' | 'and';
  }): Promise<Result<PluginType[]>> {
    try {
      if (op === 'or') {
        const results = await this.deps.mongoClient
          .getModel('plugin')
          .find({
            $or: [{ type: { $in: types } }, { tags: { $in: tags } }]
          })
          .lean();
        return successResult(results.map((result) => PluginSchema.parse(result)));
      }
      const results = await this.deps.mongoClient
        .getModel('plugin')
        .find({
          type: { $in: types },
          tags: { $in: tags }
        })
        .lean();
      return successResult(results.map((result) => PluginSchema.parse(result)));
    } catch (error) {
      return failureResult({ en: 'Failed to list plugins', 'zh-CN': '获取插件列表失败' }, error);
    }
  }

  async getPendingPluginIds(): Promise<Result<PluginUniqueIdType[]>> {
    try {
      const pendingPlugins = await this.deps.mongoClient
        .getModel('plugin')
        .find(
          {
            pending: true
          },
          {
            _id: true,
            pluginId: true,
            versionId: true,
            etag: true
          }
        )
        .lean();
      return successResult(pendingPlugins.map((plugin) => PluginUniqueIdSchema.parse(plugin)));
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get pending plugin ids',
          'zh-CN': '获取待确认插件列表失败'
        },
        error
      );
    }
  }

  async createPlugin({
    plugin,
    files,
    pending
  }: {
    plugin: PluginType;
    files: PkgContentFileObjects;
    pending: boolean;
  }): Promise<Result> {
    try {
      await this.deps.mongoClient.getModel('plugin').create({
        ...plugin,
        ...(pending
          ? { pending, expiredAt: addMinutes(Date.now(), PluginRepo.ExpiresMinutes) }
          : {})
      });

      const uniqueId = PluginUniqueIdSchema.parse(plugin);

      const [indexStream, err] = await files.index.fileStream;
      const [READMEStream, READMEErr] = await files.readme.fileStream;
      const [logoStream, logoErr] = await files.logo.fileStream;

      if (err || READMEErr || logoErr) {
        return failureResult(
          { en: 'get index.js stream error', 'zh-CN': '获取文件流错误' },
          err || READMEErr || logoErr
        );
      }

      const saveFileResults = await Promise.all([
        this.deps.privateRemoteFileStorageRepo.save({
          ...files.index.metaData,
          fileKey: this.getFileKey(uniqueId, ['index.js'], pending),
          file: indexStream
        }),
        this.deps.publicRemoteFileStorageRepo.save({
          ...files.readme.metaData,
          fileKey: this.getFileKey(uniqueId, ['README.md'], pending),
          file: READMEStream
        }),
        this.deps.publicRemoteFileStorageRepo.save({
          ...files.logo.metaData,
          fileKey: this.getFileKey(uniqueId, [files.logo.metaData.fileName], pending),
          file: logoStream
        }),
        ...files.assets.map(async (asset) => {
          const metadata = asset.metaData;
          const [stream, err] = await asset.fileStream;
          if (err)
            return failureResult({ en: 'get asset stream error', 'zh-CN': '获取文件流错误' }, err);
          return this.deps.publicRemoteFileStorageRepo.save({
            ...metadata,
            fileKey: this.getFileKey(uniqueId, ['assets', metadata.fileName], pending),
            file: stream
          });
        })
      ]);

      // set TTL
      await Promise.all([
        this.deps.fileTTLManager.setExpiration(
          saveFileResults
            .map(([result, err]) => {
              if (err) return undefined;
              return result.metaData.fileKey;
            })
            .filter(Boolean) as string[],
          this.deps.publicRemoteFileStorageRepo.getBucketName(),
          addMinutes(Date.now(), PluginRepo.ExpiresMinutes)
        ),
        this.deps.fileTTLManager.setExpiration(
          [this.getFileKey(uniqueId, ['index.js'], pending)],
          this.deps.privateRemoteFileStorageRepo.getBucketName(),
          addMinutes(Date.now(), PluginRepo.ExpiresMinutes)
        )
      ]);

      if (
        saveFileResults.every(([, err]) => {
          return !err;
        })
      ) {
        return successResult({});
      }

      return failureResult(
        {
          en: 'upload temp file error',
          'zh-CN': '上传临时文件错误'
        },
        saveFileResults.find((result) => !!result[1])?.[1]
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return failureResult(
          {
            en: 'Plugin already exists',
            'zh-CN': '插件已存在'
          },
          error
        );
      }

      return failureResult(
        {
          en: 'Failed to create plugin',
          'zh-CN': '创建插件失败'
        },
        error
      );
    }
  }

  async getPluginById(
    uniqueId: PluginUniqueIdType
  ): Promise<Result<{ info: PluginType; indexFile: FileObject }>> {
    try {
      const model = this.deps.mongoClient.getModel('plugin');
      const result = await model
        .findOne(uniqueId, {
          _id: false
        })
        .lean();

      if (!result) {
        return failureResult({
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        });
      }

      const info = PluginSchema.parse({
        ...result,
        ...result.meta
      });

      const [indexFile, err] = await this.deps.localFileStorageRepo.getFileObject(
        this.getFileKey(uniqueId, ['index.js'], false)
      );

      if (err) {
        return failureResult(
          {
            en: 'Failed to get plugin index file',
            'zh-CN': '获取插件索引文件失败'
          },
          err
        );
      }

      return successResult({
        info,
        indexFile
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get plugin by id',
          'zh-CN': '根据插件ID获取插件失败'
        },
        error
      );
    }
  }

  async getPluginFileAccessURL(
    id: PluginUniqueIdType,
    filePath: string[],
    pending: boolean
  ): Promise<Result<string>> {
    const [url, err] = await this.deps.publicRemoteFileStorageRepo.getAccessUrl(
      this.getFileKey(id, filePath, pending)
    );

    if (err) {
      return failureResult(err.reason, err.error);
    }

    return successResult(url);
  }

  async getPluginLocalPath(pluginId: PluginUniqueIdType): Promise<Result<string>> {
    const result = this.deps.localFileStorageRepo.joinPath(this.getFileKey(pluginId, [], false));
    return successResult(result);
  }

  async listTags(): Promise<Result<PluginTagListType>> {
    return successResult(Object(PluginTagsNameMap));
  }
}
