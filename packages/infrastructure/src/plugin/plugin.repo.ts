import path from 'node:path';

import { addMinutes } from 'date-fns';

import { type PluginType } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import type { FileTTLPort } from '@domain/ports/file-ttl.port';
import type {
  PluginListInputType,
  PluginListItemType,
  PluginListOutputType,
  PluginRepoPort,
  PluginVersionListInputType,
  PluginVersionListOutputType
} from '@domain/ports/plugin/plugin-repo.port';
import { PluginListItemSchema } from '@domain/ports/plugin/plugin-repo.port';
import {
  type ToolListInputType,
  ToolListItemSchema,
  type ToolListOutputType
} from '@domain/ports/plugin/tool.port';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import {
  type PluginSourceType,
  type PluginTagListType,
  PluginUniqueIdSchema,
  type PluginUniqueIdType,
  type UserPluginIdType
} from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { PluginTagsNameMap } from '@infrastructure/static-data/plugin-tag';
import type { MongoPluginSchemaType } from '@infrastructure/storage/mongo/models/plugin.model';

import { MongoClient } from '../storage/mongo';

import { Semver } from './utils/semver';
import { pluginCodecRegistry, PluginRecordSchema } from './codec';

type PluginListView = 'summary' | 'toolSummary';

const PluginListViewProjection = {
  summary: {
    pluginId: 1,
    version: 1,
    etag: 1,
    type: 1,
    author: 1,
    name: 1,
    icon: 1,
    tutorialUrl: 1,
    readmeUrl: 1,
    repoUrl: 1,
    description: 1,
    tags: 1
  },
  toolSummary: {
    pluginId: 1,
    version: 1,
    etag: 1,
    type: 1,
    author: 1,
    name: 1,
    icon: 1,
    tutorialUrl: 1,
    readmeUrl: 1,
    repoUrl: 1,
    description: 1,
    tags: 1,
    'data.toolDescription': 1,
    'data.children.id': 1,
    'data.children.name': 1,
    'data.children.description': 1,
    'data.children.toolDescription': 1
  }
} satisfies Record<PluginListView, Record<string, 1>>;

type ListedMongoPlugin = MongoPluginSchemaType & {
  _id: unknown;
};

type InstalledPluginIdentity = {
  pluginId: string;
  version: string;
  etag: string;
};

type MongoPluginWithId = MongoPluginSchemaType & {
  _id: unknown;
};

type InstalledPluginRecord = {
  source: PluginSourceType;
  plugin: ListedMongoPlugin;
};

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

  private compareVersions(a: string, b: string) {
    return new Semver(a).compare(new Semver(b));
  }

  private toPluginRecord(plugin: PluginType) {
    return pluginCodecRegistry.toRecord(plugin);
  }

  private toDomainPlugin(plugin: MongoPluginSchemaType): PluginType {
    return pluginCodecRegistry.fromRecord(PluginRecordSchema.parse(plugin));
  }

  private getInstalledPluginKey({ pluginId, version, etag }: InstalledPluginIdentity) {
    return `${pluginId}::${version}::${etag}`;
  }

  private async updateSystemInstallation(plugin: MongoPluginWithId) {
    const installationModel = this.deps.mongoClient.getModel('pluginInstallation');

    await installationModel.updateOne(
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

  private constructor(private readonly deps: PluginRepoDeps) {}

  async getPluginByUserPluginId({
    pluginId,
    source,
    version
  }: UserPluginIdType): Promise<Result<PluginType>> {
    const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const normalizedSource = source ?? 'system';
    const normalizedVersion = version?.trim();

    const installation = normalizedVersion
      ? await installationModel
          .findOne(
            { source: normalizedSource, version: normalizedVersion, pluginId },
            { _id: 0, pluginId: 1, version: 1, etag: 1 }
          )
          .lean()
      : await installationModel
          .find(
            { source: normalizedSource, pluginId },
            { _id: 0, pluginId: 1, version: 1, etag: 1 }
          )
          .lean()
          .then((items) => items.sort((a, b) => this.compareVersions(b.version, a.version))[0]);

    if (installation) {
      const plugin = await pluginModel
        .findOne({
          pluginId: installation.pluginId,
          version: installation.version,
          etag: installation.etag,
          status: PluginStatusEnum.active
        })
        .lean();

      if (plugin) {
        return successResult(this.toDomainPlugin(plugin));
      }
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

  async listVersions({
    pluginId,
    source
  }: PluginVersionListInputType): Promise<Result<PluginVersionListOutputType>> {
    try {
      const installations = await this.deps.mongoClient
        .getModel('pluginInstallation')
        .find(
          {
            pluginId,
            source
          },
          {
            _id: 0,
            pluginId: 1,
            etag: 1,
            version: 1
          }
        )
        .lean();

      const pluginConditions = installations.map((item) => ({
        pluginId: item.pluginId,
        version: item.version,
        etag: item.etag
      }));
      const plugins = pluginConditions.length
        ? await this.deps.mongoClient
            .getModel('plugin')
            .find({
              status: PluginStatusEnum.active,
              $or: pluginConditions
            })
            .lean()
        : [];
      const pluginMap = new Map(
        plugins.map((plugin) => [this.getInstalledPluginKey(plugin), this.toDomainPlugin(plugin)])
      );

      const versions = installations
        .filter((item) => pluginMap.has(this.getInstalledPluginKey(item)))
        .sort((a, b) => this.compareVersions(b.version, a.version))
        .map((item) => {
          const plugin = pluginMap.get(this.getInstalledPluginKey(item));

          return {
            version: item.version,
            versionDescription: plugin?.versionDescription
          };
        });

      return successResult(versions);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to list plugin versions',
          'zh-CN': '获取插件版本列表失败'
        },
        error
      );
    }
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

      await this.updateSystemInstallation(plugin);

      return successResult(confirmedPlugin);
    } catch (error) {
      return failureResult({ en: 'Failed to confirm plugin', 'zh-CN': '确认插件失败' }, error);
    }
  }

  async deletePendingPlugin(uniqueId: PluginUniqueIdType): Promise<Result> {
    try {
      const pendingPrefix = this.getFileKey(uniqueId, [], true);
      const pendingPathPrefix = `${pendingPrefix}/`;
      const cleanupSteps = await Promise.all([
        this.deps.publicRemoteFileStorageRepo.deletePath(pendingPrefix),
        this.deps.privateRemoteFileStorageRepo.deletePath(pendingPrefix),
        this.deps.localFileStorageRepo.deletePath(pendingPrefix)
      ]);

      const cleanupErr = cleanupSteps.find(([, err]) => err)?.[1];
      if (cleanupErr) {
        return failureResult(
          {
            en: 'Failed to delete pending plugin files',
            'zh-CN': '删除 pending 插件文件失败'
          },
          cleanupErr
        );
      }

      await this.deps.mongoClient.getModel('s3ttl').deleteMany({
        minioKey: {
          $regex: `^${this.escapeRegex(pendingPathPrefix)}`
        }
      });

      await this.deps.mongoClient.getModel('plugin').deleteOne({
        ...uniqueId,
        status: PluginStatusEnum.pending
      });

      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to delete pending plugin',
          'zh-CN': '删除 pending 插件失败'
        },
        error
      );
    }
  }

  private async listInstalledPluginsByView(
    { op, types, tags, sources }: PluginListInputType,
    view: PluginListView
  ): Promise<InstalledPluginRecord[]> {
    const normalizedSources = sources && sources.length > 0 ? sources : ['system'];
    const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const installations = await pluginInstallationModel
      .find(
        {
          source: { $in: normalizedSources }
        },
        {
          _id: 0,
          source: 1,
          pluginId: 1,
          version: 1,
          etag: 1,
          pluginObjectId: 1
        }
      )
      .lean();

    const latestInstallationMap = new Map<
      string,
      {
        source: string;
        pluginId: string;
        version: string;
        etag: string;
        pluginObjectId?: unknown;
      }
    >();

    for (const installation of installations) {
      const key = `${installation.source}::${installation.pluginId}`;
      const existingInstallation = latestInstallationMap.get(key);

      if (
        !existingInstallation ||
        this.compareVersions(installation.version, existingInstallation.version) > 0
      ) {
        latestInstallationMap.set(key, installation);
      }
    }

    const latestInstallations = Array.from(latestInstallationMap.values()).sort((a, b) => {
      const sourceCompare = a.source.localeCompare(b.source);
      if (sourceCompare !== 0) {
        return sourceCompare;
      }
      return a.pluginId.localeCompare(b.pluginId);
    });

    if (latestInstallations.length === 0) {
      return [];
    }

    const filterConditions = [] as Array<Record<string, unknown>>;

    if (types && types.length > 0) {
      filterConditions.push({ type: { $in: types } });
    }

    if (tags && tags.length > 0) {
      filterConditions.push({ tags: { $in: tags } });
    }

    const installedPluginConditions = latestInstallations.map((item) => ({
      pluginId: item.pluginId,
      version: item.version,
      etag: item.etag
    }));
    const query: Record<string, unknown> = {
      status: PluginStatusEnum.active,
      $or: installedPluginConditions
    };

    if (filterConditions.length > 0) {
      if (op === 'or') {
        query.$and = [{ $or: installedPluginConditions }, { $or: filterConditions }];
        delete query.$or;
      } else {
        Object.assign(query, ...filterConditions);
      }
    }

    const plugins = await pluginModel
      .find(query, PluginListViewProjection[view])
      .lean<ListedMongoPlugin[]>();

    const pluginMap = new Map<string, ListedMongoPlugin>();

    for (const plugin of plugins) {
      pluginMap.set(this.getInstalledPluginKey(plugin), plugin);
    }

    return latestInstallations.flatMap<InstalledPluginRecord>((installation) => {
      const plugin = pluginMap.get(this.getInstalledPluginKey(installation));
      if (!plugin) {
        return [];
      }

      return [
        {
          source: installation.source,
          plugin
        }
      ];
    });
  }

  async list(input: PluginListInputType): Promise<Result<PluginListOutputType>> {
    try {
      const installedPlugins = await this.listInstalledPluginsByView(input, 'summary');
      const items = installedPlugins.map<PluginListItemType>(({ source, plugin }) =>
        PluginListItemSchema.parse({
          pluginId: plugin.pluginId,
          version: plugin.version,
          etag: plugin.etag,
          type: plugin.type,
          author: plugin.author ?? undefined,
          name: plugin.name,
          icon: plugin.icon,
          tutorialUrl: plugin.tutorialUrl ?? undefined,
          readmeUrl: plugin.readmeUrl ?? undefined,
          repoUrl: plugin.repoUrl ?? undefined,
          description: plugin.description,
          tags: plugin.tags ?? undefined,
          source
        })
      );

      return successResult(items);
    } catch (error) {
      return failureResult({ en: 'Failed to list plugins', 'zh-CN': '获取插件列表失败' }, error);
    }
  }

  async listToolSummaries({
    tags,
    op,
    sources
  }: ToolListInputType): Promise<Result<ToolListOutputType>> {
    try {
      const installedPlugins = await this.listInstalledPluginsByView(
        {
          types: ['tool'],
          tags,
          op,
          sources
        },
        'toolSummary'
      );
      const tools = installedPlugins.map(({ source, plugin }) => {
        const data = plugin.data as
          | {
              toolDescription?: unknown;
              children?: Array<{
                id?: unknown;
                name?: unknown;
                description?: unknown;
                toolDescription?: unknown;
              }>;
            }
          | undefined;

        return ToolListItemSchema.parse({
          pluginId: plugin.pluginId,
          version: plugin.version,
          etag: plugin.etag,
          type: plugin.type,
          author: plugin.author ?? undefined,
          name: plugin.name,
          icon: plugin.icon,
          tutorialUrl: plugin.tutorialUrl ?? undefined,
          readmeUrl: plugin.readmeUrl ?? undefined,
          repoUrl: plugin.repoUrl ?? undefined,
          description: plugin.description,
          tags: plugin.tags ?? undefined,
          toolDescription: data?.toolDescription,
          source,
          isToolset: Boolean(data?.children?.length),
          children: data?.children?.map((child) => ({
            id: child.id,
            name: child.name,
            description: child.description,
            toolDescription: child.toolDescription
          }))
        });
      });

      return successResult(tools);
    } catch (error) {
      return failureResult({ en: 'Failed to list tools', 'zh-CN': '获取工具列表失败' }, error);
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

  async disablePlugins(uniqueIds: PluginUniqueIdType[]): Promise<Result> {
    try {
      if (uniqueIds.length === 0) {
        return successResult({});
      }

      await this.deps.mongoClient.getModel('plugin').updateMany(
        {
          $or: uniqueIds
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

      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to disable plugins',
          'zh-CN': '禁用插件失败'
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

    let installedPlugin: MongoPluginWithId | undefined;

    try {
      const existingPlugin = await pluginModel
        .findOne(uniqueId, {
          _id: true,
          status: true
        })
        .lean();

      if (existingPlugin) {
        if (pending && existingPlugin.status === PluginStatusEnum.pending) {
          await pluginModel.updateOne(uniqueId, {
            $set: {
              expiredAt: pendingExpiresAt,
              updateAt: new Date()
            }
          });
        } else if (!pending && existingPlugin.status === PluginStatusEnum.active) {
          installedPlugin = {
            ...this.toPluginRecord(plugin),
            _id: existingPlugin._id
          } as MongoPluginWithId;
        } else {
          return failureResult({
            en: 'Plugin already exists',
            'zh-CN': '插件已存在'
          });
        }
      } else {
        const createdPlugin = await pluginModel.create({
          ...this.toPluginRecord(plugin),
          ...(pending
            ? {
                status: PluginStatusEnum.pending,
                expiredAt: pendingExpiresAt
              }
            : {})
        });
        installedPlugin = createdPlugin.toObject();
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

      if (!pending && installedPlugin) {
        try {
          await this.updateSystemInstallation(installedPlugin);
        } catch (error) {
          return failureResult(
            {
              en: 'Failed to update plugin installation',
              'zh-CN': '更新插件安装记录失败'
            },
            error
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
    return successResult(
      Object.entries(PluginTagsNameMap).map(([id, name]) => ({
        id,
        name
      }))
    );
  }
}
