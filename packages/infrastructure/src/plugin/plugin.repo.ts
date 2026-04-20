import path from 'node:path';

import { addMinutes } from 'date-fns';

import {
  type PluginTagType,
  type PluginType,
  type PluginTypeType
} from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import type { FileTTLPort } from '@domain/ports/file-ttl.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import {
  type PluginTagListType,
  PluginUniqueIdSchema,
  type PluginUniqueIdType,
  type UserPluginIdType
} from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { PluginTagsNameMap } from '@infrastructure/static-data/plugin-tag';
import type { MongoPluginSchemaType } from '@infrastructure/storage/mongo/models/plugin.model';

import { MongoClient } from '../storage/mongo';

import { pluginCodecRegistry, PluginRecordSchema } from './codec';

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

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toPluginRecord(plugin: PluginType) {
    return pluginCodecRegistry.toRecord(plugin);
  }

  private toDomainPlugin(plugin: MongoPluginSchemaType): PluginType {
    return pluginCodecRegistry.fromRecord(PluginRecordSchema.parse(plugin));
  }

  private getManagedPublicFileNames(fileKeys: string[]): Set<string> {
    return new Set(fileKeys.map((fileKey) => path.basename(fileKey)));
  }

  private extractManagedFileName(value: string | undefined, managedFileNames: Set<string>) {
    if (!value) return undefined;

    try {
      const parsed = new URL(value);
      const fileName = path.basename(parsed.pathname);
      return managedFileNames.has(fileName) ? fileName : undefined;
    } catch {
      const fileName = path.basename(value);
      return managedFileNames.has(fileName) ? fileName : undefined;
    }
  }

  private async refreshConfirmedPlugin(
    plugin: MongoPluginSchemaType,
    managedPublicFileNames: Set<string>
  ): Promise<Result<PluginType>> {
    const domainPlugin = this.toDomainPlugin(plugin);
    const uniqueId = PluginUniqueIdSchema.parse(domainPlugin);

    const resolvePublicFileURL = async (value: string | undefined) => {
      const fileName = this.extractManagedFileName(value, managedPublicFileNames);
      if (!fileName) {
        return successResult(value);
      }

      const [url, err] = await this.getPluginFileAccessURL(uniqueId, [fileName], false);
      if (err) {
        return failureResult(
          {
            en: `Failed to resolve confirmed file url: ${fileName}`,
            'zh-CN': `解析确认后文件地址失败: ${fileName}`
          },
          err
        );
      }

      return successResult(url);
    };

    return pluginCodecRegistry.refreshConfirmedAssets(domainPlugin, {
      resolvePublicFileURL
    });
  }

  private getFileKey(id: PluginUniqueIdType, filePath: string[], pending: boolean): string {
    const array = pending
      ? ['temp', id.pluginId, id.version, id.etag, ...filePath]
      : [id.pluginId, id.version, id.etag, ...filePath];
    return path.join(...array);
  }

  constructor(private readonly deps: PluginRepoDeps) {}

  async getPluginByUserPluginId({
    pluginId,
    source,
    version
  }: UserPluginIdType): Promise<Result<PluginType>> {
    const plugin = await this.deps.mongoClient
      .getModel('pluginInstallation')
      .findOne({ source: source, version, pluginId })
      .populate<{
        plugin: MongoPluginSchemaType;
      }>('plugin')
      .lean();

    if (plugin) {
      return successResult(this.toDomainPlugin(plugin.plugin));
    }

    return failureResult({
      en: 'Plugin not found',
      'zh-CN': '插件未找到'
    });
  }

  async getPluginsByPluginId(pluginId: string): Promise<Result<PluginType[]>> {
    const plugins = await this.deps.mongoClient.getModel('plugin').find({ pluginId }).lean();
    return successResult(plugins.map((plugin) => this.toDomainPlugin(plugin)));
  }

  public static getInstance(deps: PluginRepoDeps): PluginRepo {
    if (!PluginRepo._instance) {
      PluginRepo._instance = new PluginRepo(deps);
    }
    return PluginRepo._instance;
  }

  async confirmPlugin(pluginId: PluginUniqueIdType): Promise<Result<PluginType>> {
    try {
      const pluginModel = this.deps.mongoClient.getModel('plugin');
      const plugin = await this.deps.mongoClient
        .getModel('plugin')
        .findOne({
          ...pluginId
        })
        .lean();

      if (!plugin) {
        return failureResult({
          en: 'Plugin not found',
          'zh-CN': '插件未找到'
        });
      }

      // get s3 files
      const [publicFiles, err] = await this.deps.publicRemoteFileStorageRepo.getFileKeysByPath(
        this.getFileKey(pluginId, [], true)
      );
      const [privateFiles, privateErr] =
        await this.deps.privateRemoteFileStorageRepo.getFileKeysByPath(
          this.getFileKey(pluginId, [], true)
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

      const managedPublicFileNames = this.getManagedPublicFileNames(publicFiles);
      const [confirmedPlugin, refreshErr] = await this.refreshConfirmedPlugin(
        plugin,
        managedPublicFileNames
      );

      if (refreshErr) {
        return failureResult(
          {
            en: 'Failed to refresh confirmed plugin',
            'zh-CN': '刷新确认后的插件数据失败'
          },
          refreshErr
        );
      }

      await pluginModel.updateMany(
        {
          pluginId: plugin.pluginId,
          version: plugin.version,
          etag: {
            $ne: plugin.etag
          },
          status: PluginStatusEnum.active
        },
        {
          $set: {
            status: PluginStatusEnum.disabled,
            updateAt: new Date()
          },
          $unset: {
            expiredAt: 1
          }
        }
      );

      await pluginModel
        .findOneAndUpdate(
          {
            ...pluginId
          },
          {
            $set: {
              ...this.toPluginRecord(confirmedPlugin),
              status: PluginStatusEnum.active,
              updateAt: new Date()
            },
            $unset: {
              expiredAt: 1
            }
          }
        )
        .lean();

      await this.deps.mongoClient.getModel('pluginInstallation').updateOne(
        {
          source: 'system',
          pluginId: plugin.pluginId,
          version: plugin.version
        },
        {
          $set: {
            etag: plugin.etag,
            pluginObjectId: plugin._id
          }
        },
        {
          upsert: true
        }
      );

      return successResult(confirmedPlugin);
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
      const conditions = [{ status: PluginStatusEnum.active }] as Array<Record<string, unknown>>;

      if (types && types.length > 0) {
        conditions.push({ type: { $in: types } });
      }

      if (tags && tags.length > 0) {
        conditions.push({ tags: { $in: tags } });
      }

      const query =
        conditions.length === 0
          ? {}
          : op === 'or'
            ? { $or: conditions }
            : Object.assign({}, ...conditions);

      const results = await this.deps.mongoClient.getModel('plugin').find(query).lean();
      return successResult(results.map((result) => this.toDomainPlugin(result)));
    } catch (error) {
      return failureResult({ en: 'Failed to list plugins', 'zh-CN': '获取插件列表失败' }, error);
    }
  }

  async listActive(): Promise<Result<PluginType[]>> {
    try {
      const results = await this.deps.mongoClient
        .getModel('plugin')
        .find({
          status: PluginStatusEnum.active
        })
        .lean();

      return successResult(results.map((result) => this.toDomainPlugin(result)));
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to list active plugins',
          'zh-CN': '获取 active 插件列表失败'
        },
        error
      );
    }
  }

  async pruneDisabled(): Promise<Result<{ count: number; plugins: PluginUniqueIdType[] }>> {
    try {
      const pluginModel = this.deps.mongoClient.getModel('plugin');
      const disabledPlugins = await pluginModel
        .find(
          {
            status: PluginStatusEnum.disabled
          },
          {
            _id: true,
            pluginId: true,
            version: true,
            etag: true
          }
        )
        .lean();

      if (disabledPlugins.length === 0) {
        return successResult({
          count: 0,
          plugins: []
        });
      }

      const pluginIds = disabledPlugins.map((plugin) => PluginUniqueIdSchema.parse(plugin));
      const pluginObjectIds = disabledPlugins.map((plugin) => plugin._id);
      const s3ttlModel = this.deps.mongoClient.getModel('s3ttl');
      const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');

      for (const uniqueId of pluginIds) {
        const activePrefix = this.getFileKey(uniqueId, [], false);
        const pendingPrefix = this.getFileKey(uniqueId, [], true);

        const cleanupSteps = await Promise.all([
          this.deps.publicRemoteFileStorageRepo.deletePath(activePrefix),
          this.deps.privateRemoteFileStorageRepo.deletePath(activePrefix),
          this.deps.localFileStorageRepo.deletePath(activePrefix),
          this.deps.publicRemoteFileStorageRepo.deletePath(pendingPrefix),
          this.deps.privateRemoteFileStorageRepo.deletePath(pendingPrefix),
          this.deps.localFileStorageRepo.deletePath(pendingPrefix)
        ]);

        const cleanupErr = cleanupSteps.find(([, err]) => err)?.[1];
        if (cleanupErr) {
          return failureResult(
            {
              en: 'Failed to delete disabled plugin files',
              'zh-CN': '删除 disabled 插件文件失败'
            },
            cleanupErr
          );
        }

        const prefixes = [activePrefix, pendingPrefix].map((prefix) => ({
          $regex: `^${this.escapeRegex(prefix)}`
        }));

        await s3ttlModel.deleteMany({
          $or: prefixes.map((minioKey) => ({ minioKey }))
        });
      }

      await pluginInstallationModel.deleteMany({
        pluginObjectId: {
          $in: pluginObjectIds
        }
      });

      await pluginModel.deleteMany({
        _id: {
          $in: pluginObjectIds
        }
      });

      return successResult({
        count: pluginIds.length,
        plugins: pluginIds
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to prune disabled plugins',
          'zh-CN': '清理 disabled 插件失败'
        },
        error
      );
    }
  }

  async getPendingPluginIds(): Promise<Result<PluginUniqueIdType[]>> {
    try {
      const pendingPlugins = await this.deps.mongoClient
        .getModel('plugin')
        .find(
          {
            status: PluginStatusEnum.pending
          },
          {
            _id: true,
            pluginId: true,
            version: true,
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
    const uniqueId = PluginUniqueIdSchema.parse(plugin);
    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const pendingExpiresAt = pending
      ? addMinutes(Date.now(), PluginRepo.ExpiresMinutes)
      : undefined;

    try {
      const existingPlugin = await pluginModel
        .findOne(
          uniqueId,
          {
            status: true
          }
        )
        .lean();

      if (existingPlugin) {
        if (pending && existingPlugin.status === PluginStatusEnum.pending) {
          await pluginModel.updateOne(uniqueId, {
            $set: {
              expiredAt: pendingExpiresAt,
              updateAt: new Date()
            }
          });
        } else {
          return failureResult({
            en: 'Plugin already exists',
            'zh-CN': '插件已存在'
          });
        }
      } else {
        await pluginModel.create({
          ...this.toPluginRecord(plugin),
          ...(pending
            ? {
                status: PluginStatusEnum.pending,
                expiredAt: pendingExpiresAt
              }
            : {})
        });
      }
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to create plugin in MongoDB',
          'zh-CN': '在 MongoDB 中创建插件失败'
        },
        error
      );
    }

    const [indexStream, err] = await files.index.fileStream;
    const [READMEStream, READMEErr] = (await files.readme?.fileStream) ?? [];

    if (err || READMEErr) {
      return failureResult(
        { en: 'get index.js stream error', 'zh-CN': '获取文件流错误' },
        err || READMEErr
      );
    }

    const publicSaveTasks = [
      ...(files.readme && READMEStream
        ? [
            this.deps.publicRemoteFileStorageRepo.save({
              ...files.readme.metaData,
              fileKey: this.getFileKey(uniqueId, ['README.md'], pending),
              file: READMEStream
            })
          ]
        : []),
      ...(files.logos ?? []).map(async (logo) => {
        const [stream, err] = await logo.fileStream;
        if (err) {
          return failureResult({ en: 'get logo stream error', 'zh-CN': '获取图标文件流错误' }, err);
        }
        return this.deps.publicRemoteFileStorageRepo.save({
          ...logo.metaData,
          fileKey: this.getFileKey(uniqueId, [logo.metaData.fileName], pending),
          file: stream
        });
      }),
      ...(files.assets?.map(async (asset) => {
        const metadata = asset.metaData;
        const [stream, err] = await asset.fileStream;
        if (err)
          return failureResult({ en: 'get asset stream error', 'zh-CN': '获取文件流错误' }, err);
        return this.deps.publicRemoteFileStorageRepo.save({
          ...metadata,
          fileKey: this.getFileKey(uniqueId, ['assets', metadata.fileName], pending),
          file: stream
        });
      }) ?? [])
    ];

    const saveTasks = [
      this.deps.privateRemoteFileStorageRepo.save({
        ...files.index.metaData,
        fileKey: this.getFileKey(uniqueId, ['index.js'], pending),
        file: indexStream
      }),
      ...publicSaveTasks
    ];

    const saveFileResults = await Promise.all(saveTasks);

    if (
      saveFileResults.every(([, err]) => {
        return !err;
      })
    ) {
      if (pending && pendingExpiresAt) {
        const publicFileKeys = saveFileResults
          .slice(1)
          .map(([result, err]) => {
            if (err) return undefined;
            return result.metaData.fileKey;
          })
          .filter(Boolean) as string[];

        const ttlResults = await Promise.all([
          publicFileKeys.length
            ? this.deps.fileTTLManager.setExpiration(
                publicFileKeys,
                this.deps.publicRemoteFileStorageRepo.getBucketName(),
                pendingExpiresAt
              )
            : successResult({}),
          this.deps.fileTTLManager.setExpiration(
            [this.getFileKey(uniqueId, ['index.js'], pending)],
            this.deps.privateRemoteFileStorageRepo.getBucketName(),
            pendingExpiresAt
          )
        ]);

        const ttlErr = ttlResults.find(([, err]) => err)?.[1];
        if (ttlErr) {
          return failureResult(
            {
              en: 'set temp file expiration failed',
              'zh-CN': '设置临时文件过期时间失败'
            },
            ttlErr
          );
        }
      }

      return successResult({});
    }

    return failureResult(
      {
        en: 'upload temp file error',
        'zh-CN': '上传临时文件错误'
      },
      saveFileResults.find((result) => !!result[1])?.[1]
    );
  }

  async getPluginById(
    uniqueId: PluginUniqueIdType
  ): Promise<Result<{ info: PluginType; indexFile: FileObject; entryFilePath: string }>> {
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

      const info = this.toDomainPlugin(result);

      const indexFileKey = this.getFileKey(uniqueId, ['index.js'], false);

      const [indexFile, err] = await (async () => {
        const [exists, existsErr] = await this.deps.localFileStorageRepo.exists(indexFileKey);
        if (!exists || existsErr) {
          // get the file first
          const [remoteIndexFile, err] =
            await this.deps.privateRemoteFileStorageRepo.getFileObject(indexFileKey);
          if (err) {
            return failureResult(
              {
                en: 'Failed to get plugin index file from remote storage',
                'zh-CN': '从远程存储获取插件索引文件失败'
              },
              err
            );
          }

          const [fileStream, streamErr] = await remoteIndexFile.fileStream;
          if (streamErr) {
            return failureResult(
              {
                en: 'Failed to read plugin index file stream',
                'zh-CN': '读取插件索引文件流失败'
              },
              streamErr
            );
          }

          return await this.deps.localFileStorageRepo.save({
            fileKey: indexFileKey,
            file: fileStream,
            contentType: remoteIndexFile.metaData.contentType,
            fileName: remoteIndexFile.metaData.fileName
          });
        }

        return await this.deps.localFileStorageRepo.getFileObject(indexFileKey);
      })();

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
        indexFile,
        entryFilePath: this.deps.localFileStorageRepo.joinPath(indexFileKey)
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
