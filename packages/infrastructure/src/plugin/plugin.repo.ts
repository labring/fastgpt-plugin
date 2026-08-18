import path from 'node:path';

import { addMinutes } from 'date-fns';
import type { ClientSession } from 'mongoose';

import { type PluginType } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { RemoteFileStoragePort } from '@domain/ports/file-storage/remote-file-storage.port';
import type { FileTTLPort } from '@domain/ports/file-ttl.port';
import type {
  PluginConfirmResultType,
  PluginCreateResultType,
  PluginDeleteInputType,
  PluginDeleteResultType,
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

import {
  deserializePluginDataJsonSchemaFields,
  deserializePluginRecordJsonSchemaFields,
  serializePluginRecordJsonSchemaFields
} from './utils/json-schema-storage-codec';
import { Semver } from './utils/semver';
import { pluginCodecRegistry, type PluginRecordPayloadType, PluginRecordSchema } from './codec';

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
    'data.secretSchema': 1,
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

type ReplaceInstalledPluginInput = {
  activateTarget: boolean;
  installedPlugin: MongoPluginWithId;
  pluginRecord?: PluginRecordPayloadType;
  source: PluginSourceType;
  uniqueId: PluginUniqueIdType;
};

type InstalledPluginRecord = {
  source: PluginSourceType;
  plugin: ListedMongoPlugin;
};

class DuplicatePluginInstallationError extends Error {}

const isDuplicateKeyError = (error: unknown): boolean =>
  Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);

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
    return serializePluginRecordJsonSchemaFields(pluginCodecRegistry.toRecord(plugin));
  }

  private toDomainPlugin(plugin: MongoPluginSchemaType): PluginType {
    return pluginCodecRegistry.fromRecord(
      PluginRecordSchema.parse(deserializePluginRecordJsonSchemaFields(plugin))
    );
  }

  private getInstalledPluginKey({ pluginId, version, etag }: InstalledPluginIdentity) {
    return `${pluginId}::${version}::${etag}`;
  }

  private getActiveInstallationFilter(filter: Record<string, unknown>) {
    return {
      $and: [
        filter,
        { $or: [{ status: 'active' }, { status: { $exists: false } }] }
      ]
    };
  }

  private getActivePluginFilter(filter: Record<string, unknown> = {}) {
    return {
      $and: [
        filter,
        { $or: [{ status: PluginStatusEnum.active }, { status: { $exists: false } }] }
      ]
    };
  }

  private hasSecretSchema(secretSchema: unknown): boolean {
    if (!secretSchema || typeof secretSchema !== 'object') {
      return false;
    }

    const schema = secretSchema as {
      $schema?: unknown;
      additionalProperties?: unknown;
      properties?: unknown;
      type?: unknown;
    };

    if ('properties' in schema) {
      return Boolean(
        schema.properties &&
        typeof schema.properties === 'object' &&
        Object.keys(schema.properties).length > 0
      );
    }

    if ('$schema' in schema || 'additionalProperties' in schema || schema.type === 'object') {
      return false;
    }

    return Object.keys(schema).length > 0;
  }

  private async updateInstallation(
    source: PluginSourceType,
    plugin: MongoPluginWithId,
    session?: ClientSession,
    status: 'pending' | 'active' | 'disabled' = 'active',
    expiredAt?: Date
  ) {
    const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const options = session ? { upsert: true, session } : { upsert: true };

    await installationModel.updateOne(
      {
        source,
        pluginId: plugin.pluginId,
        version: plugin.version,
        etag: plugin.etag
      },
      {
        $set: {
          pluginObjectId: plugin._id,
          status,
          updatedAt: new Date(),
          ...(expiredAt ? { expiredAt } : {})
        },
        $unset: expiredAt ? {} : { expiredAt: 1 }
      },
      options
    );
  }

  private async disablePluginIds(
    uniqueIds: PluginUniqueIdType[],
    session?: ClientSession
  ): Promise<void> {
    if (uniqueIds.length === 0) {
      return;
    }

    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const updateFilter = {
      $or: uniqueIds
    };
    const update = {
      $set: {
        status: PluginStatusEnum.disabled,
        updateAt: new Date()
      },
      $unset: {
        expiredAt: 1
      }
    };
    const installationFilter = {
      $or: uniqueIds.map(({ pluginId, version, etag }) => ({
        pluginId,
        version,
        etag
      }))
    };

    if (session) {
      await pluginModel.updateMany(updateFilter, update, { session });
      await pluginInstallationModel.deleteMany(installationFilter, { session });
      return;
    }

    await pluginModel.updateMany(updateFilter, update);
    await pluginInstallationModel.deleteMany(installationFilter);
  }

  private async disableUnreferencedPluginIds(
    uniqueIds: PluginUniqueIdType[],
    session?: ClientSession
  ): Promise<PluginUniqueIdType[]> {
    if (uniqueIds.length === 0) {
      return [];
    }

    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const installationFilter = {
      $or: uniqueIds.map(({ pluginId, version, etag }) => ({
        pluginId,
        version,
        etag
      }))
    };
    const installationProjection = {
      _id: 0,
      pluginId: 1,
      version: 1,
      etag: 1
    };
    const activeInstallationFilter = this.getActiveInstallationFilter(installationFilter);
    const remainingInstallations = await (session
      ? pluginInstallationModel.find(
          activeInstallationFilter,
          installationProjection,
          { session }
        )
      : pluginInstallationModel.find(activeInstallationFilter, installationProjection)
    ).lean();
    const remainingKeys = new Set(
      remainingInstallations.map((item) => this.getInstalledPluginKey(item))
    );
    const pluginsToDisable = uniqueIds.filter(
      (uniqueId) => !remainingKeys.has(this.getInstalledPluginKey(uniqueId))
    );

    if (pluginsToDisable.length === 0) {
      return [];
    }

    const updateFilter = {
      $or: pluginsToDisable
    };
    const update = {
      $set: {
        status: PluginStatusEnum.disabled,
        updateAt: new Date()
      },
      $unset: {
        expiredAt: 1
      }
    };

    if (session) {
      await pluginModel.updateMany(updateFilter, update, { session });
    } else {
      await pluginModel.updateMany(updateFilter, update);
    }

    return pluginsToDisable;
  }

  private async disableSourceActiveInstallations(
    source: PluginSourceType,
    uniqueId: PluginUniqueIdType,
    session: ClientSession
  ): Promise<PluginUniqueIdType[]> {
    const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
    const filter = this.getActiveInstallationFilter({
      source,
      pluginId: uniqueId.pluginId,
      version: uniqueId.version,
      etag: { $ne: uniqueId.etag }
    });
    const installations = await installationModel
      .find(filter, { _id: 1, pluginId: 1, version: 1, etag: 1 }, { session })
      .lean();

    if (installations.length === 0) return [];

    await installationModel.updateMany(
      { _id: { $in: installations.map((installation) => installation._id) } },
      { $set: { status: 'disabled', updatedAt: new Date() }, $unset: { expiredAt: 1 } },
      { session }
    );

    return installations.map((installation) => PluginUniqueIdSchema.parse(installation));
  }

  private async disableSameVersionActivePlugins(
    uniqueId: PluginUniqueIdType,
    session?: ClientSession
  ): Promise<Result> {
    try {
      const pluginModel = this.deps.mongoClient.getModel('plugin');
      const filter = this.getActivePluginFilter({
        pluginId: uniqueId.pluginId,
        version: uniqueId.version,
        etag: {
          $ne: uniqueId.etag
        },
      });
      const projection = {
        _id: 0,
        pluginId: 1,
        version: 1,
        etag: 1
      };
      const activePlugins = await (session
        ? pluginModel.find(filter, projection, { session })
        : pluginModel.find(filter, projection)
      ).lean();

      const replacedPluginIds = activePlugins.map((plugin) => PluginUniqueIdSchema.parse(plugin));
      await this.disableUnreferencedPluginIds(replacedPluginIds, session);

      return successResult({});
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to disable same-version active plugins',
          'zh-CN': '禁用同版本 active 插件失败'
        },
        error
      );
    }
  }

  private async replaceInstalledPlugin({
    activateTarget,
    installedPlugin,
    pluginRecord,
    source,
    uniqueId
  }: ReplaceInstalledPluginInput): Promise<Result<boolean>> {
    const pluginModel = this.deps.mongoClient.getModel('plugin');

    try {
      const runtimeRegistrationRequired = await this.deps.mongoClient.sessionRun(async (session) => {
        const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
        const existingInstallation = await installationModel
          .findOne(
            {
              source,
              pluginId: uniqueId.pluginId,
              version: uniqueId.version,
              etag: uniqueId.etag
            },
            { _id: 0, etag: 1 },
            { session }
          )
          .lean();

        if (existingInstallation?.etag === uniqueId.etag && existingInstallation.status !== 'disabled') {
          throw new DuplicatePluginInstallationError();
        }

        const currentPlugin = await pluginModel
          .findOne(uniqueId, { status: 1 }, { session })
          .lean();
        const shouldActivateTarget = activateTarget || currentPlugin?.status === PluginStatusEnum.disabled;

        if (shouldActivateTarget) {
          await pluginModel.updateOne(
            uniqueId,
            {
              $set: {
                ...(pluginRecord ?? {}),
                status: PluginStatusEnum.active,
                updateAt: new Date()
              },
              $unset: {
                expiredAt: 1
              }
            },
            {
              session
            }
          );
        }

        await this.disableSourceActiveInstallations(source, uniqueId, session);

        try {
          await this.updateInstallation(source, installedPlugin, session);
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            throw new DuplicatePluginInstallationError();
          }
          throw error;
        }

        const [, replaceActiveErr] = await this.disableSameVersionActivePlugins(uniqueId, session);

        if (replaceActiveErr) {
          throw replaceActiveErr.error;
        }
        return shouldActivateTarget;
      }, {});

      return successResult(runtimeRegistrationRequired);
    } catch (error) {
      if (error instanceof DuplicatePluginInstallationError) {
        return failureResult({
          en: 'Plugin installation already exists for this source',
          'zh-CN': '该来源下已存在相同插件安装'
        });
      }
      return failureResult(
        {
          en: 'Failed to replace active plugin installation',
          'zh-CN': '替换 active 插件安装失败'
        },
        error
      );
    }
  }

  private getFileKey(id: PluginUniqueIdType, filePath: string[], _pending = false): string {
    return path.join(id.pluginId, id.version, id.etag, ...filePath);
  }

  private getLocalPluginRuntimeFileKey(id: PluginUniqueIdType, filePath: string[]): string {
    return path.join('plugin', id.pluginId, id.version, id.etag, ...filePath);
  }

  private constructor(private readonly deps: PluginRepoDeps) { }

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
          this.getActiveInstallationFilter({
            source: normalizedSource,
            version: normalizedVersion,
            pluginId
          }),
          { _id: 0, pluginId: 1, version: 1, etag: 1 }
        )
        .lean()
      : await installationModel
        .find(
          this.getActiveInstallationFilter({ source: normalizedSource, pluginId }),
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
          $or: [{ status: PluginStatusEnum.active }, { status: { $exists: false } }]
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
          this.getActiveInstallationFilter({ pluginId, source }),
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
          .find(this.getActivePluginFilter({ $or: pluginConditions }))
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

  async confirmPlugin(
    pluginId: PluginUniqueIdType,
    source: PluginSourceType = 'system'
  ): Promise<Result<PluginConfirmResultType>> {
    try {
      const pluginModel = this.deps.mongoClient.getModel('plugin');
      const confirmed = await this.deps.mongoClient.sessionRun(async (session) => {
        const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
        const activeInstallation = await installationModel.findOne(
          this.getActiveInstallationFilter({ source, ...pluginId }),
          undefined,
          { session }
        ).lean();
        if (activeInstallation) {
          const activePlugin = await pluginModel.findOne(pluginId, undefined, { session }).lean();
          if (!activePlugin) throw new Error('Plugin not found');

          return {
            plugin: activePlugin,
            runtimeRegistrationRequired: false,
            idempotent: true,
            replacedInstallationIds: []
          };
        }

        const pendingInstallation = await installationModel
          .findOne({ source, ...pluginId, status: 'pending' }, undefined, { session })
          .lean();
        if (!pendingInstallation) return undefined;

        const replacedInstallationIds = await this.disableSourceActiveInstallations(
          source,
          pluginId,
          session
        );
        const pending = await installationModel.findOneAndUpdate(
          { source, ...pluginId, status: 'pending' },
          { $set: { status: 'active', updatedAt: new Date() }, $unset: { expiredAt: 1 } },
          { session, new: false }
        ).lean();
        if (!pending) return undefined;
        const plugin = await pluginModel.findOne(pluginId, undefined, { session }).lean();
        if (!plugin) throw new Error('Plugin not found');
        const activeCount = await installationModel.countDocuments(
          this.getActiveInstallationFilter({
            pluginId: plugin.pluginId,
            version: plugin.version,
            etag: plugin.etag
          }),
          { session }
        );
        const runtimeRegistrationRequired = activeCount === 1 && plugin.status !== PluginStatusEnum.active;
        if (plugin.status !== PluginStatusEnum.active) {
          await pluginModel.updateOne(
            pluginId,
            { $set: { status: PluginStatusEnum.active, updateAt: new Date() }, $unset: { expiredAt: 1 } },
            { session }
          );
        }
        const [, replaceErr] = await this.disableSameVersionActivePlugins(pluginId, session);
        if (replaceErr) throw replaceErr.error;
        return {
          plugin,
          runtimeRegistrationRequired,
          idempotent: false,
          replacedInstallationIds
        };
      }, {});

      if (!confirmed) {
        return failureResult({ en: 'Pending Plugin not found', 'zh-CN': '待确认插件未找到' });
      }
      return successResult({
        ...this.toDomainPlugin(confirmed.plugin),
        runtimeRegistrationRequired: confirmed.runtimeRegistrationRequired,
        idempotent: confirmed.idempotent,
        replacedInstallationIds: confirmed.replacedInstallationIds
      });

    } catch (error) {
      return failureResult({ en: 'Failed to confirm plugin', 'zh-CN': '确认插件失败' }, error);
    }
  }

  async rollbackPluginConfirmation(
    uniqueId: PluginUniqueIdType,
    source: PluginSourceType = 'system',
    replacedInstallationIds: PluginUniqueIdType[] = []
  ): Promise<Result> {
    try {
      await this.deps.mongoClient.sessionRun(async (session) => {
        const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
        await installationModel.updateOne(
          { source, ...uniqueId, status: 'active' },
          {
            $set: {
              status: 'pending',
              expiredAt: addMinutes(Date.now(), PluginRepo.ExpiresMinutes),
              updatedAt: new Date()
            }
          },
          { session }
        );
        if (replacedInstallationIds.length > 0) {
          await installationModel.updateMany(
            {
              source,
              $or: replacedInstallationIds
            },
            {
              $set: { status: 'active', updatedAt: new Date() },
              $unset: { expiredAt: 1 }
            },
            { session }
          );
          await this.deps.mongoClient.getModel('plugin').updateMany(
            { $or: replacedInstallationIds },
            {
              $set: { status: PluginStatusEnum.active, updateAt: new Date() },
              $unset: { expiredAt: 1 }
            },
            { session }
          );
        }
        await this.disableUnreferencedPluginIds([uniqueId], session);
      }, {});
      return successResult({});
    } catch (error) {
      return failureResult(
        { en: 'Failed to rollback plugin confirmation', 'zh-CN': '恢复插件待确认状态失败' },
        error
      );
    }
  }

  async deletePendingPlugin(
    uniqueId: PluginUniqueIdType,
    source: PluginSourceType = 'system'
  ): Promise<Result> {
    try {
      await this.deps.mongoClient.getModel('pluginInstallation').updateOne(
        { source, ...uniqueId, status: 'pending' },
        { $set: { status: 'disabled', updatedAt: new Date() }, $unset: { expiredAt: 1 } }
      );
      await this.disableUnreferencedPluginIds([uniqueId]);

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

  async deletePluginInstallation(
    input: PluginDeleteInputType
  ): Promise<Result<PluginDeleteResultType>> {
    try {
      const deletedPlugins = await this.deps.mongoClient.sessionRun(async (session) => {
        const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
        const installationFilter = this.getActiveInstallationFilter({
          source: input.source,
          pluginId: input.pluginId,
          ...(input.scope === 'allVersions' ? {} : { version: input.version })
        });
        const installations = await installationModel
          .find(
            installationFilter,
            { _id: 1, pluginId: 1, version: 1, etag: 1 },
            { session }
          )
          .lean();

        if (installations.length === 0) {
          throw new Error('Plugin not found');
        }

        const uniqueIds = installations.map((installation) => PluginUniqueIdSchema.parse(installation));
        await installationModel.updateMany(
          { _id: { $in: installations.map((installation) => installation._id) } },
          { $set: { status: 'disabled', updatedAt: new Date() }, $unset: { expiredAt: 1 } },
          { session }
        );

        const disabledPluginIds = await this.disableUnreferencedPluginIds(uniqueIds, session);
        const disabledKeys = new Set(disabledPluginIds.map((item) => this.getInstalledPluginKey(item)));
        const pluginRecords = await this.deps.mongoClient
          .getModel('plugin')
          .find({ $or: uniqueIds }, undefined, { session })
          .lean();
        const pluginMap = new Map(
          pluginRecords.map((plugin) => [this.getInstalledPluginKey(plugin), this.toDomainPlugin(plugin)])
        );

        return uniqueIds.map((uniqueId) => ({
          plugin: pluginMap.get(this.getInstalledPluginKey(uniqueId)),
          disabled: disabledKeys.has(this.getInstalledPluginKey(uniqueId))
        }));
      }, {});

      if (deletedPlugins.some((item) => !item.plugin)) {
        return failureResult({ en: 'Plugin not found', 'zh-CN': '插件未找到' });
      }

      return successResult({
        plugins: deletedPlugins as PluginDeleteResultType['plugins']
      });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to delete plugin installation',
          'zh-CN': '删除插件安装关系失败'
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
        this.getActiveInstallationFilter({ source: { $in: normalizedSources } }),
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
    const query: Record<string, unknown> = this.getActivePluginFilter({
      $or: installedPluginConditions
    });

    if (filterConditions.length > 0) {
      if (op === 'or') {
        query.$and = [
          { $or: [{ status: PluginStatusEnum.active }, { status: { $exists: false } }] },
          { $or: installedPluginConditions },
          { $or: filterConditions }
        ];
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
        const data = deserializePluginDataJsonSchemaFields(plugin.data) as
          | {
            toolDescription?: unknown;
            secretSchema?: unknown;
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
          hasSecret: this.hasSecretSchema(data?.secretSchema),
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
        .find(this.getActivePluginFilter())
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

      const pluginModel = this.deps.mongoClient.getModel('plugin');
      const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');

      await pluginModel.updateMany(
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

      await pluginInstallationModel.deleteMany({
        $or: uniqueIds.map(({ pluginId, version, etag }) => ({
          pluginId,
          version,
          etag
        }))
      });

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

  async disableUnreferencedPlugins(
    uniqueIds: PluginUniqueIdType[]
  ): Promise<Result<{ plugins: PluginUniqueIdType[] }>> {
    try {
      const pluginsToDisable = await this.disableUnreferencedPluginIds(uniqueIds);

      return successResult({ plugins: pluginsToDisable });
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to disable unreferenced plugins',
          'zh-CN': '禁用无引用插件失败'
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

      const s3ttlModel = this.deps.mongoClient.getModel('s3ttl');
      const pluginInstallationModel = this.deps.mongoClient.getModel('pluginInstallation');
      const pluginObjectIds = disabledPlugins.map((plugin) => plugin._id);
      const pendingInstallations = await pluginInstallationModel.find(
        { status: 'pending', pluginObjectId: { $in: pluginObjectIds } },
        { pluginObjectId: 1 }
      ).lean();
      const pendingPluginObjectIds = new Set(pendingInstallations.map((item) => String(item.pluginObjectId)));
      const removablePlugins = disabledPlugins.filter(
        (plugin) => !pendingPluginObjectIds.has(String(plugin._id))
      );
      const removablePluginIds = removablePlugins.map((plugin) => PluginUniqueIdSchema.parse(plugin));
      const removablePluginObjectIds = removablePlugins.map((plugin) => plugin._id);

      for (const uniqueId of removablePluginIds) {
        const activePrefix = this.getFileKey(uniqueId, [], false);
        const localActivePrefix = this.getLocalPluginRuntimeFileKey(uniqueId, []);

        const cleanupSteps = await Promise.all([
          this.deps.publicRemoteFileStorageRepo.deletePath(activePrefix),
          this.deps.privateRemoteFileStorageRepo.deletePath(activePrefix),
          this.deps.localFileStorageRepo.deletePath(localActivePrefix),
          this.deps.localFileStorageRepo.deletePath(activePrefix)
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

        const prefixes = [activePrefix].map((prefix) => ({
          $regex: `^${this.escapeRegex(prefix)}`
        }));

        await s3ttlModel.deleteMany({
          $or: prefixes.map((minioKey) => ({ minioKey }))
        });
      }

      await pluginInstallationModel.deleteMany({
        pluginObjectId: {
          $in: removablePluginObjectIds
        }
      });

      await pluginModel.deleteMany({
        _id: {
          $in: removablePluginObjectIds
        }
      });

      return successResult({
        count: removablePluginIds.length,
        plugins: removablePluginIds
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

  async getPendingPluginIds(source: PluginSourceType = 'system'): Promise<Result<PluginUniqueIdType[]>> {
    try {
      const pendingPlugins = await this.deps.mongoClient
        .getModel('pluginInstallation')
        .find({ source, status: 'pending' }, { _id: true, pluginId: true, version: true, etag: true })
        .lean();
      return successResult(
        pendingPlugins.map(({ pluginId, version, etag }) =>
          PluginUniqueIdSchema.parse({ pluginId, version, etag })
        )
      );
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
    pending,
    source = 'system'
  }: {
    plugin: PluginType;
    files: PkgContentFileObjects;
    pending: boolean;
    source?: PluginSourceType;
  }): Promise<Result<PluginCreateResultType>> {
    const uniqueId = PluginUniqueIdSchema.parse(plugin);
    const pluginModel = this.deps.mongoClient.getModel('plugin');
    const pendingExpiresAt = pending
      ? addMinutes(Date.now(), PluginRepo.ExpiresMinutes)
      : undefined;
    const installationModel = this.deps.mongoClient.getModel('pluginInstallation');
    let installedPlugin: MongoPluginWithId | undefined;
    let shouldUpdatePluginRecord = false;

    try {
      const existingInstallation = await installationModel
        .findOne({ source, ...uniqueId })
        .lean();
      if (existingInstallation?.etag === uniqueId.etag && existingInstallation.status !== 'disabled') {
        if (!pending) {
          return failureResult({
            en: 'Plugin installation already exists for this source',
            'zh-CN': '该来源下已存在相同插件安装'
          });
        }
        if (existingInstallation.status !== 'pending') {
          return failureResult({
            en: 'Plugin installation already exists for this source',
            'zh-CN': '该来源下已存在相同插件安装'
          });
        }
        await installationModel.updateOne(
          { _id: existingInstallation._id },
          { $set: { status: 'pending', expiredAt: pendingExpiresAt, updatedAt: new Date() } }
        );
        return successResult({ runtimeRegistrationRequired: false });
      }
      if (existingInstallation && existingInstallation.status !== 'disabled') {
        return failureResult({
          en: 'A different plugin version is already installed for this source',
          'zh-CN': '该来源下已存在其他插件版本'
        });
      }

      const existingPlugin = await pluginModel.findOne(uniqueId).lean();
      if (existingPlugin) {
        // identity is immutable: retain the first package metadata and files.
        installedPlugin = { ...existingPlugin, ...uniqueId } as MongoPluginWithId;
      }
    } catch (error) {
      return failureResult(
        { en: 'Failed to query plugin in MongoDB', 'zh-CN': '查询 MongoDB 插件失败' },
        error
      );
    }

    if (installedPlugin) {
      if (pending) {
        await this.updateInstallation(source, installedPlugin, undefined, 'pending', pendingExpiresAt);
        return successResult({ runtimeRegistrationRequired: false });
      }
      const [runtimeRegistrationRequired, replaceErr] = await this.replaceInstalledPlugin({
        activateTarget: installedPlugin.status !== PluginStatusEnum.active,
        installedPlugin,
        source,
        uniqueId
      });
      if (replaceErr) return failureResult(replaceErr);
      return successResult({ runtimeRegistrationRequired });
    }

    const pluginRecord = this.toPluginRecord(plugin);
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
            fileKey: this.getFileKey(uniqueId, ['README.md'], false),
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
          fileKey: this.getFileKey(uniqueId, [logo.metaData.fileName], false),
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
          fileKey: this.getFileKey(uniqueId, ['assets', metadata.fileName], false),
          file: stream
        });
      }) ?? [])
    ];

    const saveTasks = [
      this.deps.privateRemoteFileStorageRepo.save({
        ...files.index.metaData,
        fileKey: this.getFileKey(uniqueId, ['index.js'], false),
        file: indexStream
      }),
      ...publicSaveTasks
    ];

    const saveFileResults = await Promise.all(saveTasks);

    if (saveFileResults.every(([, saveErr]) => !saveErr)) {
      try {
        const createdPlugin = await pluginModel.create({
          ...pluginRecord,
          status: PluginStatusEnum.disabled
        });
        installedPlugin = createdPlugin.toObject() as MongoPluginWithId;
        shouldUpdatePluginRecord = true;
      } catch (createError) {
        if (!isDuplicateKeyError(createError)) {
          return failureResult(
            { en: 'Failed to create plugin in MongoDB', 'zh-CN': '在 MongoDB 中创建插件失败' },
            createError
          );
        }
        const concurrentPlugin = await pluginModel.findOne(uniqueId).lean();
        if (!concurrentPlugin) {
          return failureResult(
            { en: 'Failed to create plugin in MongoDB', 'zh-CN': '在 MongoDB 中创建插件失败' },
            createError
          );
        }
        installedPlugin = concurrentPlugin as MongoPluginWithId;
      }

      if (pending) {
        await this.updateInstallation(source, installedPlugin, undefined, 'pending', pendingExpiresAt);
        return successResult({ runtimeRegistrationRequired: false });
      }

      const [runtimeRegistrationRequired, replaceActiveErr] = await this.replaceInstalledPlugin({
        activateTarget: true,
        installedPlugin,
        pluginRecord: shouldUpdatePluginRecord ? pluginRecord : undefined,
        source,
        uniqueId
      });
      if (replaceActiveErr) return failureResult(replaceActiveErr);

      return successResult({ runtimeRegistrationRequired });
    }

    return failureResult(
      {
        en: 'upload plugin file error',
        'zh-CN': '上传插件文件错误'
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

      const remoteIndexFileKey = this.getFileKey(uniqueId, ['index.js'], false);
      const localIndexFileKey = this.getLocalPluginRuntimeFileKey(uniqueId, ['index.js']);

      const [indexFile, err] = await (async () => {
        const [exists, existsErr] = await this.deps.localFileStorageRepo.exists(localIndexFileKey);
        if (!exists || existsErr) {
          // get the file first
          const [remoteIndexFile, err] =
            await this.deps.privateRemoteFileStorageRepo.getFileObject(remoteIndexFileKey);
          if (err) {
            return failureResult(
              {
                en: 'Failed to get plugin index.js from remote storage',
                'zh-CN': '从远程存储获取插件 index.js 失败'
              },
              err
            );
          }

          const [fileStream, streamErr] = await remoteIndexFile.fileStream;
          if (streamErr) {
            return failureResult(
              {
                en: 'Failed to read plugin index.js file stream',
                'zh-CN': '读取插件 index.js 文件流失败'
              },
              streamErr
            );
          }

          return await this.deps.localFileStorageRepo.save({
            fileKey: localIndexFileKey,
            file: fileStream,
            contentType: remoteIndexFile.metaData.contentType,
            fileName: remoteIndexFile.metaData.fileName
          });
        }

        return await this.deps.localFileStorageRepo.getFileObject(localIndexFileKey);
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
        entryFilePath: this.deps.localFileStorageRepo.joinPath(localIndexFileKey)
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
    pending: boolean,
    _source: PluginSourceType = 'system'
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
    const result = this.deps.localFileStorageRepo.joinPath(
      this.getLocalPluginRuntimeFileKey(pluginId, [])
    );
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
