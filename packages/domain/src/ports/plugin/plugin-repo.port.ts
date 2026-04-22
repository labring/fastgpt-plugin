import z from 'zod';

import {
  PluginBaseSchema,
  type PluginTagType,
  type PluginType,
  type PluginTypeType
} from '../../entities/plugin.entity';
import type { FileObject } from '../../value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '../../value-objects/file/pkg-file.vo';
import {
  PluginSourceSchema,
  type PluginSourceType,
  type PluginTagListType,
  type PluginUniqueIdType,
  type UserPluginIdType
} from '../../value-objects/plugin.vo';
import { I18nStringSchema } from '../../value-objects/i18n-string.vo';
import type { Result } from '../../value-objects/result.vo';

export const PluginListItemSchema = z.object({
  ...PluginBaseSchema.omit({
    versionDescription: true,
    permission: true
  }).shape,
  source: PluginSourceSchema
});

export type PluginListItemType = z.infer<typeof PluginListItemSchema>;

export type PluginListInputType = {
  /** 筛选类型 */
  types?: PluginTypeType[]; // 筛选 type
  /** 筛选标签 */
  tags?: PluginTagType[]; // 筛选 tag
  /** 操作符，默认为 or */
  op?: 'or' | 'and'; // 默认为 or
  /** 插件来源，默认只拉取 system 的*/
  sources?: PluginSourceType[];
};

export type PluginListOutputType = PluginListItemType[];

export const PluginVersionItemSchema = z.object({
  version: z.string(),
  versionDescription: I18nStringSchema.optional()
});

export type PluginVersionItemType = z.infer<typeof PluginVersionItemSchema>;

export type PluginVersionListInputType = {
  pluginId: string;
  source: PluginSourceType;
};

export type PluginVersionListOutputType = PluginVersionItemType[];

/** 操作 Plugin S3, Mongo，本地缓存, 代码里面的静态配置 ...*/
export interface PluginRepoPort {
  /** 获取 pending 的 plugin id */
  getPendingPluginIds(): Promise<Result<PluginUniqueIdType[]>>;
  /** 创建插件 */
  createPlugin(arg: {
    plugin: PluginType;
    pending?: boolean;
    files: PkgContentFileObjects;
  }): Promise<Result>;

  /** 移除某个插件的 pending 状态 */
  confirmPlugin(uniqueId: PluginUniqueIdType): Promise<Result<PluginType>>;

  /** 获取某个插件信息 */
  getPluginById(
    uniqueId: PluginUniqueIdType
  ): Promise<Result<{ info: PluginType; indexFile: FileObject; entryFilePath: string }>>;

  getPluginsByPluginId(pluginId: string): Promise<Result<PluginType[]>>;
  getPluginByUserPluginId(userPluginId: UserPluginIdType): Promise<Result<PluginType>>;
  listVersions(arg: PluginVersionListInputType): Promise<Result<PluginVersionListOutputType>>;

  /** 列出所有插件 */
  list(arg: PluginListInputType): Promise<Result<PluginListOutputType>>;
  listActive(): Promise<Result<PluginType[]>>;
  pruneDisabled(): Promise<Result<{ count: number; plugins: PluginUniqueIdType[] }>>;

  listTags(): Promise<Result<PluginTagListType>>;

  // File-Store
  // Remote
  getPluginFileAccessURL(
    uniqueId: PluginUniqueIdType,
    filePath: string[],
    pending: boolean
  ): Promise<Result<string>>;
}
